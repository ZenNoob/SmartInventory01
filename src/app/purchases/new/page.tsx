'use client'

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { Customer, Product, Unit } from "@/lib/types";
import { PurchaseOrderForm } from "../components/purchase-order-form";


export default function NewPurchasePage() {
    const firestore = useFirestore();

    const productsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, "products"));
    }, [firestore]);

    const unitsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, "units"));
    }, [firestore]);

    const { data: products, isLoading: productsLoading } = useCollection<Product>(productsQuery);
    const { data: units, isLoading: unitsLoading } = useCollection<Unit>(unitsQuery);

    const isLoading = productsLoading || unitsLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <p>Đang tải dữ liệu...</p>
            </div>
        )
    }

    return (
        <PurchaseOrderForm 
            products={products || []}
            units={units || []}
        />
    )
}
