import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { List, ListChecks, ListPlus } from "lucide-react"

export default function GuidePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">Hướng dẫn sử dụng</h1>
      <p className="text-muted-foreground mb-8">
        Chào mừng bạn đến với hệ thống Quản lý Bán hàng. Dưới đây là hướng dẫn chi tiết về các chức năng chính.
      </p>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Quản lý Sản phẩm & Kho</CardTitle>
            <CardDescription>Các chức năng liên quan đến việc thiết lập và quản lý sản phẩm.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-primary" />
                    <span>Quản lý Danh mục & Đơn vị tính</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="prose prose-sm max-w-none pl-7 text-muted-foreground">
                  <p>Đây là bước đầu tiên để thiết lập hệ thống của bạn.</p>
                  <ul>
                    <li><strong>Danh mục:</strong> Dùng để phân loại sản phẩm (ví dụ: "Giống lúa", "Phân bón"). Bạn có thể thêm, sửa, xóa các danh mục trong trang "Danh mục".</li>
                    <li><strong>Đơn vị tính:</strong> Rất quan trọng cho việc quản lý kho. Bạn có thể tạo các đơn vị cơ sở (ví dụ: "kg", "cái") và các đơn vị quy đổi (ví dụ: 1 "Bao" = 40 "kg"). Thao tác này được thực hiện trong trang "Đơn vị tính".</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <ListPlus className="h-5 w-5 text-primary" />
                    <span>Quản lý Sản phẩm</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="prose prose-sm max-w-none pl-7 text-muted-foreground">
                  <p>Trang "Sản phẩm" là nơi bạn quản lý toàn bộ hàng hóa của mình.</p>
                  <ul>
                    <li><strong>Thêm sản phẩm:</strong> Bạn có thể thêm sản phẩm mới bằng cách điền các thông tin cơ bản và các lô nhập hàng. Đơn vị tính chính của sản phẩm sẽ không thể thay đổi sau khi có lô nhập hàng đầu tiên.</li>
                    <li><strong>Nhập hàng:</strong> Trong form sản phẩm, bạn có thể thêm các "đợt nhập hàng" để ghi lại số lượng, giá nhập và ngày nhập. Đây là cơ sở để tính toán giá vốn và tồn kho.</li>
                    <li><strong>Tồn kho:</strong> Hệ thống tự động tính toán tồn kho dựa trên lịch sử nhập và bán hàng. Cột "Tồn kho" hiển thị số lượng còn lại theo đơn vị tính chính.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bán hàng & Khách hàng</CardTitle>
            <CardDescription>Các chức năng liên quan đến giao dịch và quản lý khách hàng.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                    <div className="flex items-center gap-2">
                        <ListPlus className="h-5 w-5 text-primary" />
                        <span>Tạo và Quản lý Đơn hàng</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="prose prose-sm max-w-none pl-7 text-muted-foreground">
                   <p>Trang "Bán hàng" là nơi thực hiện các giao dịch.</p>
                   <ul>
                    <li><strong>Tạo đơn hàng:</strong> Nhấn nút "Tạo đơn hàng". Chọn khách hàng, ngày bán và thêm các sản phẩm vào đơn.</li>
                    <li><strong>Giá bán:</strong> Bạn có thể nhập giá bán cho từng sản phẩm trong đơn. Hệ thống có hiển thị giá nhập trung bình để bạn tham khảo.</li>
                    <li><strong>Thanh toán:</strong> Nhập số tiền khách thanh toán, hệ thống sẽ tự động tính toán nợ cũ, tổng tiền phải trả và nợ còn lại.</li>
                    <li><strong>In hóa đơn:</strong> Sau khi tạo, bạn có thể xem chi tiết và in hóa đơn cho khách hàng.</li>
                   </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>
                    <div className="flex items-center gap-2">
                        <List className="h-5 w-5 text-primary" />
                        <span>Quản lý Khách hàng</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="prose prose-sm max-w-none pl-7 text-muted-foreground">
                    <p>Trang "Khách hàng" giúp bạn quản lý thông tin và công nợ.</p>
                    <ul>
                      <li><strong>Thêm/Sửa khách hàng:</strong> Quản lý thông tin chi tiết của khách hàng, bao gồm thông tin liên hệ, địa chỉ, hạn mức tín dụng và thông tin ngân hàng.</li>
                      <li><strong>Công nợ:</strong> Cột "Công nợ" hiển thị tổng số tiền khách hàng đã trả và số nợ còn lại. Bạn có thể nhấp vào số tiền đã trả để xem chi tiết lịch sử thanh toán.</li>
                      <li><strong>Xem chi tiết:</strong> Nhấp vào tên khách hàng để xem trang chi tiết, bao gồm lịch sử thanh toán và các thông tin khác.</li>
                    </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Báo cáo & Thống kê</CardTitle>
            <CardDescription>Các công cụ giúp bạn phân tích tình hình kinh doanh.</CardDescription>
          </CardHeader>
          <CardContent>
             <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                    <div className="flex items-center gap-2">
                        <List className="h-5 w-5 text-primary" />
                        <span>Các loại báo cáo</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="prose prose-sm max-w-none pl-7 text-muted-foreground">
                    <p>Menu "Báo cáo" cung cấp các báo cáo chi tiết:</p>
                   <ul>
                    <li><strong>Báo cáo Công nợ:</strong> Tổng hợp công nợ của tất cả khách hàng. Cho phép bạn ghi nhận thanh toán nhanh chóng.</li>
                    <li><strong>Báo cáo Doanh thu:</strong> Phân tích doanh thu theo khoảng thời gian tùy chọn (tuần, tháng, năm). Có biểu đồ trực quan hóa dữ liệu.</li>
                    <li><strong>Báo cáo Sản phẩm đã bán:</strong> Thống kê các sản phẩm đã bán trong một khoảng thời gian, giúp bạn biết sản phẩm nào bán chạy nhất.</li>
                    <li><strong>Xuất Excel:</strong> Tất cả các báo cáo đều có chức năng xuất ra file Excel để bạn lưu trữ hoặc phân tích thêm.</li>
                   </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
