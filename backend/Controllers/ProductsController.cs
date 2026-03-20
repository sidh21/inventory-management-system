using InventorySystem.Data;
using InventorySystem.DTOs;
using InventorySystem.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InventorySystem.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ProductsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] int? categoryId,
        [FromQuery] bool? lowStock,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var query = _db.Products
            .Include(p => p.Category)
            .Include(p => p.Supplier)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(p => p.Name.Contains(search) || (p.SKU != null && p.SKU.Contains(search)));

        if (categoryId.HasValue)
            query = query.Where(p => p.CategoryId == categoryId.Value);

        if (lowStock == true)
            query = query.Where(p => p.Quantity <= p.ReorderLevel);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(p => p.UpdatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => MapProduct(p))
            .ToListAsync();

        return Ok(new PagedResult<ProductDto>(items, total, page, pageSize));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var p = await _db.Products
            .Include(p => p.Category)
            .Include(p => p.Supplier)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (p == null) return NotFound();
        return Ok(MapProduct(p));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateProductDto dto)
    {
        var product = new Product
        {
            Name         = dto.Name,
            SKU          = dto.SKU,
            Description  = dto.Description,
            Price        = dto.Price,
            Quantity     = dto.Quantity,
            ReorderLevel = dto.ReorderLevel,
            CategoryId   = dto.CategoryId,
            SupplierId   = dto.SupplierId,
        };

        _db.Products.Add(product);

        if (dto.Quantity > 0)
        {
            _db.StockLogs.Add(new StockLog
            {
                Product   = product,
                Quantity  = dto.Quantity,
                Type      = "IN",
                Note      = "Initial stock",
                CreatedBy = User.Identity?.Name ?? "System"
            });
        }

        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = product.Id }, new { id = product.Id });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProductDto dto)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null) return NotFound();

        product.Name         = dto.Name;
        product.SKU          = dto.SKU;
        product.Description  = dto.Description;
        product.Price        = dto.Price;
        product.ReorderLevel = dto.ReorderLevel;
        product.IsActive     = dto.IsActive;
        product.CategoryId   = dto.CategoryId;
        product.SupplierId   = dto.SupplierId;
        product.UpdatedAt    = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null) return NotFound();
        product.IsActive = false;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static ProductDto MapProduct(Product p) => new(
        p.Id, p.Name, p.SKU, p.Description,
        p.Price, p.Quantity, p.ReorderLevel, p.IsActive,
        p.CategoryId, p.Category?.Name ?? "",
        p.SupplierId, p.Supplier?.Name,
        p.Quantity <= p.ReorderLevel,
        p.CreatedAt, p.UpdatedAt);
}
