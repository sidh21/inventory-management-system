using ClosedXML.Excel;
using InventorySystem.Data;
using Microsoft.EntityFrameworkCore;

namespace InventorySystem.Services;

public interface IReportService
{
    Task<byte[]> ExportProductsToExcelAsync();
    Task<byte[]> ExportStockLogsToExcelAsync(DateTime? from, DateTime? to);
    Task<object> GetInventoryReportAsync();
    Task<object> GetStockMovementSummaryAsync(int days);
}

public class ReportService : IReportService
{
    private readonly AppDbContext _db;
    public ReportService(AppDbContext db) => _db = db;

    public async Task<byte[]> ExportProductsToExcelAsync()
    {
        var products = await _db.Products
            .Include(p => p.Category)
            .Include(p => p.Supplier)
            .OrderBy(p => p.Name)
            .ToListAsync();

        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add("Products");

        // Header row
        var headers = new[] { "ID", "Name", "SKU", "Category", "Supplier", "Price (₹)", "Stock Qty", "Reorder Level", "Status", "Created" };
        for (int i = 0; i < headers.Length; i++)
        {
            var cell = ws.Cell(1, i + 1);
            cell.Value = headers[i];
            cell.Style.Font.Bold      = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#2563EB");
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        }

        // Data rows
        for (int i = 0; i < products.Count; i++)
        {
            var p   = products[i];
            var row = i + 2;
            ws.Cell(row, 1).Value  = p.Id;
            ws.Cell(row, 2).Value  = p.Name;
            ws.Cell(row, 3).Value  = p.SKU ?? "";
            ws.Cell(row, 4).Value  = p.Category?.Name ?? "";
            ws.Cell(row, 5).Value  = p.Supplier?.Name ?? "";
            ws.Cell(row, 6).Value  = (double)p.Price;
            ws.Cell(row, 7).Value  = p.Quantity;
            ws.Cell(row, 8).Value  = p.ReorderLevel;
            ws.Cell(row, 9).Value  = p.IsActive ? "Active" : "Archived";
            ws.Cell(row, 10).Value = p.CreatedAt.ToString("dd MMM yyyy");

            // Highlight low stock rows in red
            if (p.Quantity <= p.ReorderLevel)
                ws.Row(row).Style.Fill.BackgroundColor = XLColor.FromHtml("#FEE2E2");
        }

        ws.Columns().AdjustToContents();
        ws.SheetView.FreezeRows(1);

        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return ms.ToArray();
    }

    public async Task<byte[]> ExportStockLogsToExcelAsync(DateTime? from, DateTime? to)
    {
        var query = _db.StockLogs.Include(s => s.Product).AsQueryable();
        if (from.HasValue) query = query.Where(s => s.CreatedAt >= from.Value);
        if (to.HasValue)   query = query.Where(s => s.CreatedAt <= to.Value);

        var logs = await query.OrderByDescending(s => s.CreatedAt).ToListAsync();

        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add("Stock Movements");

        var headers = new[] { "ID", "Product", "Type", "Quantity", "Note", "By", "Date" };
        for (int i = 0; i < headers.Length; i++)
        {
            var cell = ws.Cell(1, i + 1);
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#059669");
            cell.Style.Font.FontColor = XLColor.White;
        }

        for (int i = 0; i < logs.Count; i++)
        {
            var l = logs[i]; var row = i + 2;
            ws.Cell(row, 1).Value = l.Id;
            ws.Cell(row, 2).Value = l.Product?.Name ?? "";
            ws.Cell(row, 3).Value = l.Type;
            ws.Cell(row, 4).Value = l.Quantity;
            ws.Cell(row, 5).Value = l.Note ?? "";
            ws.Cell(row, 6).Value = l.CreatedBy;
            ws.Cell(row, 7).Value = l.CreatedAt.ToString("dd MMM yyyy HH:mm");

            var color = l.Type == "IN" ? "#D1FAE5" : l.Type == "OUT" ? "#FEE2E2" : "#FEF3C7";
            ws.Row(row).Style.Fill.BackgroundColor = XLColor.FromHtml(color);
        }

        ws.Columns().AdjustToContents();
        ws.SheetView.FreezeRows(1);
        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return ms.ToArray();
    }

    public async Task<object> GetInventoryReportAsync()
    {
        var products = await _db.Products.Include(p => p.Category).Where(p => p.IsActive).ToListAsync();

        var byCategory = products
            .GroupBy(p => p.Category?.Name ?? "Uncategorized")
            .Select(g => new
            {
                category     = g.Key,
                productCount = g.Count(),
                totalStock   = g.Sum(p => p.Quantity),
                totalValue   = g.Sum(p => p.Price * p.Quantity),
                lowStockCount= g.Count(p => p.Quantity <= p.ReorderLevel)
            }).OrderByDescending(x => x.totalValue).ToList();

        var topProducts = products
            .OrderByDescending(p => p.Price * p.Quantity)
            .Take(10)
            .Select(p => new { p.Name, p.Quantity, p.Price, value = p.Price * p.Quantity, category = p.Category?.Name })
            .ToList();

        return new
        {
            summary = new
            {
                totalProducts    = products.Count,
                totalValue       = products.Sum(p => p.Price * p.Quantity),
                lowStockCount    = products.Count(p => p.Quantity <= p.ReorderLevel),
                outOfStockCount  = products.Count(p => p.Quantity == 0),
            },
            byCategory,
            topProducts
        };
    }

    public async Task<object> GetStockMovementSummaryAsync(int days = 30)
    {
        var from = DateTime.UtcNow.AddDays(-days);
        var logs = await _db.StockLogs
            .Include(s => s.Product)
            .Where(s => s.CreatedAt >= from)
            .ToListAsync();

        var daily = logs
            .GroupBy(l => l.CreatedAt.Date)
            .Select(g => new
            {
                date    = g.Key.ToString("dd MMM"),
                inQty   = g.Where(l => l.Type == "IN").Sum(l => Math.Abs(l.Quantity)),
                outQty  = g.Where(l => l.Type == "OUT").Sum(l => Math.Abs(l.Quantity)),
            })
            .OrderBy(x => x.date)
            .ToList();

        var topMoved = logs
            .GroupBy(l => l.Product?.Name ?? "Unknown")
            .Select(g => new { product = g.Key, movements = g.Count(), totalQty = g.Sum(l => Math.Abs(l.Quantity)) })
            .OrderByDescending(x => x.movements)
            .Take(5)
            .ToList();

        return new { daily, topMoved, totalIn = logs.Where(l => l.Type == "IN").Sum(l => Math.Abs(l.Quantity)), totalOut = logs.Where(l => l.Type == "OUT").Sum(l => Math.Abs(l.Quantity)) };
    }
}
