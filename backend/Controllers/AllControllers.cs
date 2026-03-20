using InventorySystem.Data;
using InventorySystem.DTOs;
using InventorySystem.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InventorySystem.Controllers;

// ─── Stock Controller ──────────────────────────────────────
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StockController : ControllerBase
{
    private readonly AppDbContext _db;
    public StockController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetLogs([FromQuery] int? productId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = _db.StockLogs.Include(s => s.Product).AsQueryable();
        if (productId.HasValue) query = query.Where(s => s.ProductId == productId.Value);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(s => new StockLogDto(s.Id, s.ProductId, s.Product.Name, s.Quantity, s.Type, s.Note, s.CreatedBy, s.CreatedAt))
            .ToListAsync();

        return Ok(new PagedResult<StockLogDto>(items, total, page, pageSize));
    }

    [HttpPost("adjust")]
    public async Task<IActionResult> Adjust([FromBody] AdjustStockDto dto)
    {
        var product = await _db.Products.FindAsync(dto.ProductId);
        if (product == null) return NotFound();

        var qty = dto.Type == "OUT" ? -Math.Abs(dto.Quantity) : Math.Abs(dto.Quantity);
        product.Quantity += qty;
        if (product.Quantity < 0) return BadRequest(new { message = "Insufficient stock" });

        product.UpdatedAt = DateTime.UtcNow;
        _db.StockLogs.Add(new StockLog
        {
            ProductId = dto.ProductId,
            Quantity  = qty,
            Type      = dto.Type,
            Note      = dto.Note,
            CreatedBy = User.Identity?.Name ?? "System"
        });

        await _db.SaveChangesAsync();
        return Ok(new { message = "Stock updated", newQuantity = product.Quantity });
    }
}

// ─── Categories Controller ─────────────────────────────────
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _db;
    public CategoriesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var cats = await _db.Categories
            .Include(c => c.Products)
            .Select(c => new CategoryDto(c.Id, c.Name, c.Description, c.Products.Count))
            .ToListAsync();
        return Ok(cats);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateCategoryDto dto)
    {
        var cat = new Category { Name = dto.Name, Description = dto.Description };
        _db.Categories.Add(cat);
        await _db.SaveChangesAsync();
        return Ok(new CategoryDto(cat.Id, cat.Name, cat.Description, 0));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCategoryDto dto)
    {
        var cat = await _db.Categories.FindAsync(id);
        if (cat == null) return NotFound();
        cat.Name = dto.Name; cat.Description = dto.Description;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var cat = await _db.Categories.FindAsync(id);
        if (cat == null) return NotFound();
        _db.Categories.Remove(cat);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

// ─── Suppliers Controller ──────────────────────────────────
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SuppliersController : ControllerBase
{
    private readonly AppDbContext _db;
    public SuppliersController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var suppliers = await _db.Suppliers
            .OrderBy(s => s.Name)
            .Select(s => new SupplierDto(s.Id, s.Name, s.Email, s.Phone, s.Address, s.IsActive, s.CreatedAt))
            .ToListAsync();
        return Ok(suppliers);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var s = await _db.Suppliers.FindAsync(id);
        if (s == null) return NotFound();
        return Ok(new SupplierDto(s.Id, s.Name, s.Email, s.Phone, s.Address, s.IsActive, s.CreatedAt));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateSupplierDto dto)
    {
        var s = new Supplier { Name = dto.Name, Email = dto.Email, Phone = dto.Phone, Address = dto.Address };
        _db.Suppliers.Add(s);
        await _db.SaveChangesAsync();
        return Ok(new SupplierDto(s.Id, s.Name, s.Email, s.Phone, s.Address, s.IsActive, s.CreatedAt));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateSupplierDto dto)
    {
        var s = await _db.Suppliers.FindAsync(id);
        if (s == null) return NotFound();
        s.Name = dto.Name; s.Email = dto.Email; s.Phone = dto.Phone;
        s.Address = dto.Address; s.IsActive = dto.IsActive;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var s = await _db.Suppliers.FindAsync(id);
        if (s == null) return NotFound();
        s.IsActive = false;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

// ─── Purchase Orders Controller ────────────────────────────
[ApiController]
[Route("api/purchase-orders")]
[Authorize]
public class PurchaseOrdersController : ControllerBase
{
    private readonly AppDbContext _db;
    public PurchaseOrdersController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var query = _db.PurchaseOrders.Include(po => po.Supplier).Include(po => po.Items).ThenInclude(i => i.Product).AsQueryable();
        if (!string.IsNullOrEmpty(status)) query = query.Where(po => po.Status == status);

        var total = await query.CountAsync();
        var items = await query.OrderByDescending(po => po.OrderDate).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(po => MapOrder(po)).ToListAsync();

        return Ok(new PagedResult<PurchaseOrderDto>(items, total, page, pageSize));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var po = await _db.PurchaseOrders.Include(po => po.Supplier).Include(po => po.Items).ThenInclude(i => i.Product).FirstOrDefaultAsync(po => po.Id == id);
        if (po == null) return NotFound();
        return Ok(MapOrder(po));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreatePurchaseOrderDto dto)
    {
        var orderNumber = $"PO-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(1000, 9999)}";
        var items = dto.Items.Select(i => new PurchaseOrderItem { ProductId = i.ProductId, Quantity = i.Quantity, UnitCost = i.UnitCost }).ToList();
        var total = items.Sum(i => i.Quantity * i.UnitCost);

        var po = new PurchaseOrder
        {
            OrderNumber = orderNumber,
            SupplierId  = dto.SupplierId,
            Notes       = dto.Notes,
            TotalAmount = total,
            Items       = items
        };

        _db.PurchaseOrders.Add(po);
        await _db.SaveChangesAsync();
        return Ok(new { id = po.Id, orderNumber = po.OrderNumber });
    }

    [HttpPatch("{id}/receive")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Receive(int id)
    {
        var po = await _db.PurchaseOrders.Include(po => po.Items).FirstOrDefaultAsync(po => po.Id == id);
        if (po == null) return NotFound();
        if (po.Status != "Pending") return BadRequest(new { message = "Order is not pending" });

        po.Status = "Received";
        po.ReceivedAt = DateTime.UtcNow;

        foreach (var item in po.Items)
        {
            var product = await _db.Products.FindAsync(item.ProductId);
            if (product != null)
            {
                product.Quantity += item.Quantity;
                product.UpdatedAt = DateTime.UtcNow;
                _db.StockLogs.Add(new StockLog
                {
                    ProductId = item.ProductId,
                    Quantity  = item.Quantity,
                    Type      = "IN",
                    Note      = $"Purchase Order {po.OrderNumber}",
                    CreatedBy = User.Identity?.Name ?? "System"
                });
            }
        }

        await _db.SaveChangesAsync();
        return Ok(new { message = "Order received and stock updated" });
    }

    [HttpPatch("{id}/cancel")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Cancel(int id)
    {
        var po = await _db.PurchaseOrders.FindAsync(id);
        if (po == null) return NotFound();
        if (po.Status != "Pending") return BadRequest(new { message = "Only pending orders can be cancelled" });
        po.Status = "Cancelled";
        await _db.SaveChangesAsync();
        return Ok(new { message = "Order cancelled" });
    }

    private static PurchaseOrderDto MapOrder(PurchaseOrder po) => new(
        po.Id, po.OrderNumber, po.SupplierId, po.Supplier?.Name ?? "",
        po.Status, po.TotalAmount, po.OrderDate, po.ReceivedAt, po.Notes,
        po.Items?.Select(i => new PurchaseOrderItemDto(i.Id, i.ProductId, i.Product?.Name ?? "", i.Quantity, i.UnitCost)).ToList() ?? new());
}

// ─── Dashboard Controller ──────────────────────────────────
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _db;
    public DashboardController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var totalProducts    = await _db.Products.CountAsync(p => p.IsActive);
        var lowStockCount    = await _db.Products.CountAsync(p => p.IsActive && p.Quantity <= p.ReorderLevel);
        var totalSuppliers   = await _db.Suppliers.CountAsync(s => s.IsActive);
        var pendingOrders    = await _db.PurchaseOrders.CountAsync(po => po.Status == "Pending");
        var totalValue       = await _db.Products.Where(p => p.IsActive).SumAsync(p => (decimal)p.Price * p.Quantity);

        var lowStockItems = await _db.Products
            .Include(p => p.Category)
            .Where(p => p.IsActive && p.Quantity <= p.ReorderLevel)
            .OrderBy(p => p.Quantity)
            .Take(5)
            .Select(p => new LowStockItemDto(p.Id, p.Name, p.Quantity, p.ReorderLevel, p.Category.Name))
            .ToListAsync();

        var recentActivity = await _db.StockLogs
            .Include(s => s.Product)
            .OrderByDescending(s => s.CreatedAt)
            .Take(8)
            .Select(s => new RecentStockLogDto(s.Product.Name, s.Quantity, s.Type, s.CreatedBy, s.CreatedAt))
            .ToListAsync();

        return Ok(new DashboardDto(totalProducts, lowStockCount, totalSuppliers, pendingOrders, totalValue, lowStockItems, recentActivity));
    }
}
