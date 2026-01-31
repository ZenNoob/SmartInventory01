import { query, queryOne } from '../db';

export interface Promotion {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'bundle' | 'voucher';
  status: 'active' | 'inactive' | 'expired' | 'scheduled';
  startDate: Date;
  endDate: Date;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  maxDiscountAmount?: number;
  buyQuantity?: number;
  getQuantity?: number;
  minPurchaseAmount?: number;
  minQuantity?: number;
  usageLimit?: number;
  usageCount: number;
  usagePerCustomer?: number;
  priority: number;
  applyTo: 'all' | 'specific_products' | 'specific_categories' | 'specific_customers';
}

export interface ApplicablePromotion extends Promotion {
  applicableProducts?: string[];
  applicableCategories?: string[];
  applicableCustomers?: string[];
}

export class PromotionService {
  /**
   * Get active promotions for a store
   */
  async getActivePromotions(storeId: string): Promise<ApplicablePromotion[]> {
    const now = new Date();
    
    const promotions = await query(
      `SELECT * FROM Promotions 
       WHERE store_id = @storeId 
         AND status = 'active'
         AND start_date <= @now 
         AND end_date >= @now
       ORDER BY priority DESC, created_at DESC`,
      { storeId, now }
    ).catch(err => {
      console.error('Error fetching active promotions:', err);
      return [];
    });

    // Load applicable products/categories/customers for each promotion
    const result: ApplicablePromotion[] = [];
    for (const promo of promotions as any[]) {
      const promotion: ApplicablePromotion = {
        id: promo.id,
        storeId: promo.store_id,
        name: promo.name,
        description: promo.description,
        type: promo.type,
        status: promo.status,
        startDate: promo.start_date,
        endDate: promo.end_date,
        discountType: promo.discount_type,
        discountValue: promo.discount_value,
        maxDiscountAmount: promo.max_discount_amount,
        buyQuantity: promo.buy_quantity,
        getQuantity: promo.get_quantity,
        minPurchaseAmount: promo.min_purchase_amount,
        minQuantity: promo.min_quantity,
        usageLimit: promo.usage_limit,
        usageCount: promo.usage_count,
        usagePerCustomer: promo.usage_per_customer,
        priority: promo.priority,
        applyTo: promo.apply_to,
      };

      if (promo.apply_to === 'specific_products') {
        const products = await query(
          'SELECT product_id FROM PromotionProducts WHERE promotion_id = @promotionId',
          { promotionId: promo.id }
        ).catch(() => []);
        promotion.applicableProducts = products.map((p: any) => p.product_id);
      }

      if (promo.apply_to === 'specific_categories') {
        const categories = await query(
          'SELECT category_id FROM PromotionCategories WHERE promotion_id = @promotionId',
          { promotionId: promo.id }
        ).catch(() => []);
        promotion.applicableCategories = categories.map((c: any) => c.category_id);
      }

      if (promo.apply_to === 'specific_customers') {
        const customers = await query(
          'SELECT customer_id FROM PromotionCustomers WHERE promotion_id = @promotionId',
          { promotionId: promo.id }
        ).catch(() => []);
        promotion.applicableCustomers = customers.map((c: any) => c.customer_id);
      }

      result.push(promotion);
    }

    return result;
  }

  /**
   * Calculate discount for cart items
   */
  async calculateDiscount(
    storeId: string,
    items: Array<{ productId: string; quantity: number; price: number; categoryId?: string }>,
    customerId?: string,
    subtotal?: number
  ): Promise<{
    totalDiscount: number;
    appliedPromotions: Array<{ promotionId: string; name: string; discount: number }>;
  }> {
    try {
      const promotions = await this.getActivePromotions(storeId);
      const appliedPromotions: Array<{ promotionId: string; name: string; discount: number }> = [];
      let totalDiscount = 0;

      const calculatedSubtotal = subtotal || items.reduce((sum, item) => sum + item.quantity * item.price, 0);

      for (const promo of promotions) {
        // Check if promotion is applicable
        if (!this.isPromotionApplicable(promo, items, customerId, calculatedSubtotal)) {
          continue;
        }

        // Check usage limit
        if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
          continue;
        }

        let discount = 0;

        switch (promo.type) {
          case 'percentage':
          case 'fixed_amount':
            discount = this.calculateSimpleDiscount(promo, calculatedSubtotal);
            break;
          
          case 'buy_x_get_y':
            discount = this.calculateBuyXGetYDiscount(promo, items);
            break;
        }

        if (discount > 0) {
          appliedPromotions.push({
            promotionId: promo.id,
            name: promo.name,
            discount,
          });
          totalDiscount += discount;
        }
      }

      return { totalDiscount, appliedPromotions };
    } catch (error) {
      console.error('[PromotionService] calculateDiscount error:', error);
      // Return empty result instead of throwing
      return { totalDiscount: 0, appliedPromotions: [] };
    }
  }

  private isPromotionApplicable(
    promo: ApplicablePromotion,
    items: Array<{ productId: string; quantity: number; price: number; categoryId?: string }>,
    customerId?: string,
    subtotal?: number
  ): boolean {
    // Check minimum purchase amount
    if (promo.minPurchaseAmount && subtotal && subtotal < promo.minPurchaseAmount) {
      return false;
    }

    // Check minimum quantity
    if (promo.minQuantity) {
      const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
      if (totalQty < promo.minQuantity) {
        return false;
      }
    }

    // Check apply_to conditions
    if (promo.applyTo === 'specific_products') {
      const hasApplicableProduct = items.some(item => 
        promo.applicableProducts?.includes(item.productId)
      );
      if (!hasApplicableProduct) return false;
    }

    if (promo.applyTo === 'specific_categories') {
      const hasApplicableCategory = items.some(item => 
        item.categoryId && promo.applicableCategories?.includes(item.categoryId)
      );
      if (!hasApplicableCategory) return false;
    }

    if (promo.applyTo === 'specific_customers') {
      if (!customerId || !promo.applicableCustomers?.includes(customerId)) {
        return false;
      }
    }

    return true;
  }

  private calculateSimpleDiscount(promo: Promotion, subtotal: number): number {
    if (promo.discountType === 'percentage' && promo.discountValue) {
      let discount = subtotal * (promo.discountValue / 100);
      if (promo.maxDiscountAmount) {
        discount = Math.min(discount, promo.maxDiscountAmount);
      }
      return discount;
    }

    if (promo.discountType === 'fixed' && promo.discountValue) {
      return promo.discountValue;
    }

    return 0;
  }

  private calculateBuyXGetYDiscount(
    promo: Promotion,
    items: Array<{ productId: string; quantity: number; price: number }>
  ): number {
    if (!promo.buyQuantity || !promo.getQuantity) return 0;

    // Find applicable items
    const applicableItems = items.filter(item => {
      // If specific products, check if item is in the list
      // For now, apply to all items in cart
      return true;
    });

    let totalDiscount = 0;
    for (const item of applicableItems) {
      const sets = Math.floor(item.quantity / (promo.buyQuantity + promo.getQuantity));
      const freeItems = sets * promo.getQuantity;
      totalDiscount += freeItems * item.price;
    }

    return totalDiscount;
  }

  /**
   * Record promotion usage
   */
  async recordUsage(
    promotionId: string,
    saleId: string,
    discountAmount: number,
    customerId?: string
  ): Promise<void> {
    await query(
      `INSERT INTO PromotionUsage (id, promotion_id, customer_id, sale_id, discount_amount)
       VALUES (NEWID(), @promotionId, @customerId, @saleId, @discountAmount)`,
      { promotionId, customerId, saleId, discountAmount }
    );

    await query(
      `UPDATE Promotions SET usage_count = usage_count + 1 WHERE id = @promotionId`,
      { promotionId }
    );
  }
}

export const promotionService = new PromotionService();
