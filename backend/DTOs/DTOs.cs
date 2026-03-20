namespace InventorySystem.DTOs;

// Auth
public record LoginDto(string Email, string Password);
public record RegisterDto(string Name, string Email, string Password, string Role = "Staff");
public record AuthResponseDto(string Token, string Name, string Email, string Role);

// Category
public record CategoryDto(int Id, string Name, string? Description, int ProductCount);
public record CreateCategoryDto(string Name, string? Description);
public record UpdateCategoryDto(string Name, string? Description);

// Supplier
public record SupplierDto(int Id, string Name, string? Email, string? Phone, string? Address, bool IsActive, DateTime CreatedAt);
public record CreateSupplierDto(string Name, string? Email, string? Phone, string? Address);
public record UpdateSupplierDto(string Name, string? Email, string? Phone, string? Address, bool IsActive);

// Product
public record ProductDto(
    int Id, string Name, string? SKU, string? Description,
    decimal Price, int Quantity, int ReorderLevel, bool IsActive,
    int CategoryId, string CategoryName,
    int? SupplierId, string? SupplierName,
    bool IsLowStock, DateTime CreatedAt, DateTime UpdatedAt);

public record CreateProductDto(
    string Name, string? SKU, string? Description,
    decimal Price, int Quantity, int ReorderLevel,
    int CategoryId, int? SupplierId);

public record UpdateProductDto(
    string Name, string? SKU, string? Description,
    decimal Price, int ReorderLevel, bool IsActive,
    int CategoryId, int? SupplierId);

// Stock
public record StockLogDto(int Id, int ProductId, string ProductName, int Quantity, string Type, string? Note, string CreatedBy, DateTime CreatedAt);
public record AdjustStockDto(int ProductId, int Quantity, string Type, string? Note);

// Purchase Order
public record PurchaseOrderDto(
    int Id, string OrderNumber, int SupplierId, string SupplierName,
    string Status, decimal TotalAmount, DateTime OrderDate,
    DateTime? ReceivedAt, string? Notes,
    List<PurchaseOrderItemDto> Items);

public record PurchaseOrderItemDto(int Id, int ProductId, string ProductName, int Quantity, decimal UnitCost);

public record CreatePurchaseOrderDto(
    int SupplierId, string? Notes,
    List<CreatePurchaseOrderItemDto> Items);

public record CreatePurchaseOrderItemDto(int ProductId, int Quantity, decimal UnitCost);

// Dashboard
public record DashboardDto(
    int TotalProducts, int LowStockCount, int TotalSuppliers,
    int PendingOrders, decimal TotalInventoryValue,
    List<LowStockItemDto> LowStockItems,
    List<RecentStockLogDto> RecentActivity);

public record LowStockItemDto(int Id, string Name, int Quantity, int ReorderLevel, string CategoryName);
public record RecentStockLogDto(string ProductName, int Quantity, string Type, string CreatedBy, DateTime CreatedAt);

// Pagination
public record PagedResult<T>(List<T> Items, int Total, int Page, int PageSize);
