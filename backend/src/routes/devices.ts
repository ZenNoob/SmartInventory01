import { Router, Response } from 'express';
import { authenticate, storeContext, AuthRequest } from '../middleware/auth';
import { deviceIntegrationService } from '../services/device-integration-service';

const router = Router();

router.use(authenticate);
router.use(storeContext);

/**
 * POST /api/devices/printer/configure
 * Cấu hình máy in nhiệt
 */
router.post('/printer/configure', async (req: AuthRequest, res: Response) => {
  try {
    const { type, port, baudRate, paperWidth } = req.body;

    deviceIntegrationService.configureThermalPrinter({
      type,
      port,
      baudRate,
      paperWidth,
    });

    res.json({ success: true, message: 'Printer configured successfully' });
  } catch (error) {
    console.error('Printer configuration error:', error);
    res.status(500).json({ error: 'Failed to configure printer' });
  }
});

/**
 * POST /api/devices/printer/print-receipt
 * In hóa đơn nhiệt
 */
router.post('/printer/print-receipt', async (req: AuthRequest, res: Response) => {
  try {
    const receipt = req.body;

    const success = await deviceIntegrationService.printThermalReceipt(receipt);

    res.json({ success, message: success ? 'Receipt printed' : 'Print failed' });
  } catch (error) {
    console.error('Print receipt error:', error);
    res.status(500).json({ error: 'Failed to print receipt' });
  }
});

/**
 * POST /api/devices/card-reader/configure
 * Cấu hình máy quẹt thẻ
 */
router.post('/card-reader/configure', async (req: AuthRequest, res: Response) => {
  try {
    const { type, port } = req.body;

    deviceIntegrationService.configureCardReader({ type, port });

    res.json({ success: true, message: 'Card reader configured successfully' });
  } catch (error) {
    console.error('Card reader configuration error:', error);
    res.status(500).json({ error: 'Failed to configure card reader' });
  }
});

/**
 * POST /api/devices/card-reader/read
 * Đọc thẻ
 */
router.post('/card-reader/read', async (req: AuthRequest, res: Response) => {
  try {
    const { type } = req.body;

    let cardData = null;

    switch (type) {
      case 'magnetic':
        cardData = await deviceIntegrationService.readMagneticCard();
        break;
      case 'chip':
        cardData = await deviceIntegrationService.readChipCard();
        break;
      case 'contactless':
        cardData = await deviceIntegrationService.readContactlessCard();
        break;
      default:
        res.status(400).json({ error: 'Invalid card type' });
        return;
    }

    if (cardData) {
      res.json({ success: true, data: cardData });
    } else {
      res.json({ success: false, message: 'No card detected' });
    }
  } catch (error) {
    console.error('Card read error:', error);
    res.status(500).json({ error: 'Failed to read card' });
  }
});

/**
 * POST /api/devices/scale/configure
 * Cấu hình cân điện tử
 */
router.post('/scale/configure', async (req: AuthRequest, res: Response) => {
  try {
    const { type, port, baudRate, unit } = req.body;

    deviceIntegrationService.configureScale({
      type,
      port,
      baudRate,
      unit,
    });

    res.json({ success: true, message: 'Scale configured successfully' });
  } catch (error) {
    console.error('Scale configuration error:', error);
    res.status(500).json({ error: 'Failed to configure scale' });
  }
});

/**
 * GET /api/devices/scale/read
 * Đọc trọng lượng từ cân
 */
router.get('/scale/read', async (req: AuthRequest, res: Response) => {
  try {
    const weightData = await deviceIntegrationService.readWeight();

    if (weightData) {
      res.json({ success: true, data: weightData });
    } else {
      res.json({ success: false, message: 'Failed to read weight' });
    }
  } catch (error) {
    console.error('Scale read error:', error);
    res.status(500).json({ error: 'Failed to read scale' });
  }
});

/**
 * POST /api/devices/scale/tare
 * Đặt cân về 0
 */
router.post('/scale/tare', async (req: AuthRequest, res: Response) => {
  try {
    const success = await deviceIntegrationService.tareScale();

    res.json({ success, message: success ? 'Scale tared' : 'Tare failed' });
  } catch (error) {
    console.error('Scale tare error:', error);
    res.status(500).json({ error: 'Failed to tare scale' });
  }
});

/**
 * POST /api/devices/display/configure
 * Cấu hình màn hình khách hàng
 */
router.post('/display/configure', async (req: AuthRequest, res: Response) => {
  try {
    const { type, port, lines, columns } = req.body;

    deviceIntegrationService.configureCustomerDisplay({
      type,
      port,
      lines,
      columns,
    });

    res.json({ success: true, message: 'Display configured successfully' });
  } catch (error) {
    console.error('Display configuration error:', error);
    res.status(500).json({ error: 'Failed to configure display' });
  }
});

/**
 * POST /api/devices/display/show
 * Hiển thị thông tin lên màn hình khách hàng
 */
router.post('/display/show', async (req: AuthRequest, res: Response) => {
  try {
    const { line1, line2 } = req.body;

    const success = await deviceIntegrationService.displayToCustomer(line1, line2);

    res.json({ success, message: success ? 'Display updated' : 'Display failed' });
  } catch (error) {
    console.error('Display show error:', error);
    res.status(500).json({ error: 'Failed to update display' });
  }
});

/**
 * POST /api/devices/display/price
 * Hiển thị giá sản phẩm
 */
router.post('/display/price', async (req: AuthRequest, res: Response) => {
  try {
    const { productName, price } = req.body;

    const success = await deviceIntegrationService.displayPrice(productName, price);

    res.json({ success });
  } catch (error) {
    console.error('Display price error:', error);
    res.status(500).json({ error: 'Failed to display price' });
  }
});

/**
 * POST /api/devices/display/total
 * Hiển thị tổng tiền
 */
router.post('/display/total', async (req: AuthRequest, res: Response) => {
  try {
    const { total } = req.body;

    const success = await deviceIntegrationService.displayTotal(total);

    res.json({ success });
  } catch (error) {
    console.error('Display total error:', error);
    res.status(500).json({ error: 'Failed to display total' });
  }
});

/**
 * POST /api/devices/display/welcome
 * Hiển thị thông báo chào mừng
 */
router.post('/display/welcome', async (req: AuthRequest, res: Response) => {
  try {
    const success = await deviceIntegrationService.displayWelcome();

    res.json({ success });
  } catch (error) {
    console.error('Display welcome error:', error);
    res.status(500).json({ error: 'Failed to display welcome' });
  }
});

/**
 * POST /api/devices/display/clear
 * Xóa màn hình
 */
router.post('/display/clear', async (req: AuthRequest, res: Response) => {
  try {
    const success = await deviceIntegrationService.clearDisplay();

    res.json({ success });
  } catch (error) {
    console.error('Display clear error:', error);
    res.status(500).json({ error: 'Failed to clear display' });
  }
});

/**
 * POST /api/devices/sound/beep
 * Phát âm thanh beep
 */
router.post('/sound/beep', async (req: AuthRequest, res: Response) => {
  try {
    const { duration = 100 } = req.body;

    const success = await deviceIntegrationService.playBeep(duration);

    res.json({ success });
  } catch (error) {
    console.error('Beep error:', error);
    res.status(500).json({ error: 'Failed to play beep' });
  }
});

/**
 * POST /api/devices/sound/announce
 * Phát thông báo giọng nói
 */
router.post('/sound/announce', async (req: AuthRequest, res: Response) => {
  try {
    const { message } = req.body;

    const success = await deviceIntegrationService.playVoiceAnnouncement(message);

    res.json({ success });
  } catch (error) {
    console.error('Voice announcement error:', error);
    res.status(500).json({ error: 'Failed to play announcement' });
  }
});

/**
 * GET /api/devices/status
 * Lấy trạng thái tất cả thiết bị
 */
router.get('/status', async (req: AuthRequest, res: Response) => {
  try {
    const status = deviceIntegrationService.getDeviceStatus();

    res.json({ success: true, data: status });
  } catch (error) {
    console.error('Device status error:', error);
    res.status(500).json({ error: 'Failed to get device status' });
  }
});

/**
 * GET /api/devices/check/:deviceType
 * Kiểm tra kết nối thiết bị
 */
router.get('/check/:deviceType', async (req: AuthRequest, res: Response) => {
  try {
    const { deviceType } = req.params;

    if (!['printer', 'cardReader', 'scale', 'display'].includes(deviceType)) {
      res.status(400).json({ error: 'Invalid device type' });
      return;
    }

    const connected = await deviceIntegrationService.checkDeviceConnection(
      deviceType as 'printer' | 'cardReader' | 'scale' | 'display'
    );

    res.json({ success: true, connected });
  } catch (error) {
    console.error('Device check error:', error);
    res.status(500).json({ error: 'Failed to check device' });
  }
});

export default router;
