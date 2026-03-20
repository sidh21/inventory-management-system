namespace InventorySystem.Models;

public class User
{
    public int      Id        { get; set; }
    public string   Name      { get; set; } = string.Empty;
    public string   Email     { get; set; } = string.Empty;
    public string   Password  { get; set; } = string.Empty;
    public string   Role      { get; set; } = "Staff"; // Admin | Staff
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Category
{
    public int     Id          { get; set; }
    public string  Name        { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ICollection<Product> Products { get; set; } = new List<Product>();
}

public class Supplier
{
    public int     Id          { get; set; }
    public string  Name        { get; set; } = string.Empty;
    public string? Email       { get; set; }
    public string? Phone       { get; set; }
    public string? Address     { get; set; }
    public bool    IsActive    { get; set; } = true;
    public DateTime CreatedAt  { get; set; } = DateTime.UtcNow;
    public ICollection<Product>       Products       { get; set; } = new List<Product>();
    public ICollection<PurchaseOrder> PurchaseOrders { get; set; } = new List<PurchaseOrder>();
}

public class Product
{
    public int      Id            { get; set; }
    public string   Name          { get; set; } = string.Empty;
    public string?  SKU           { get; set; }
    public string?  Description   { get; set; }
    public decimal  Price         { get; set; }
    public int      Quantity      { get; set; }
    public int      ReorderLevel  { get; set; } = 10;
    public bool     IsActive      { get; set; } = true;
    public DateTime CreatedAt     { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt     { get; set; } = DateTime.UtcNow;

    public int   CategoryId  { get; set; }
    public int?  SupplierId  { get; set; }

    public Category  Category  { get; set; } = null!;
    public Supplier? Supplier  { get; set; }
    public ICollection<StockLog> StockLogs { get; set; } = new List<StockLog>();
}

public class StockLog
{
    public int      Id          { get; set; }
    public int      ProductId   { get; set; }
    public int      Quantity    { get; set; }   // positive = IN, negative = OUT
    public string   Type        { get; set; } = "IN"; // IN | OUT | ADJUSTMENT
    public string?  Note        { get; set; }
    public DateTime CreatedAt   { get; set; } = DateTime.UtcNow;
    public string   CreatedBy   { get; set; } = string.Empty;
    public Product  Product     { get; set; } = null!;
}

public class PurchaseOrder
{
    public int      Id           { get; set; }
    public string   OrderNumber  { get; set; } = string.Empty;
    public int      SupplierId   { get; set; }
    public string   Status       { get; set; } = "Pending"; // Pending | Received | Cancelled
    public decimal  TotalAmount  { get; set; }
    public DateTime OrderDate    { get; set; } = DateTime.UtcNow;
    public DateTime? ReceivedAt  { get; set; }
    public string?  Notes        { get; set; }
    public Supplier Supplier     { get; set; } = null!;
    public ICollection<PurchaseOrderItem> Items { get; set; } = new List<PurchaseOrderItem>();
}

public class PurchaseOrderItem
{
    public int      Id               { get; set; }
    public int      PurchaseOrderId  { get; set; }
    public int      ProductId        { get; set; }
    public int      Quantity         { get; set; }
    public decimal  UnitCost         { get; set; }
    public PurchaseOrder PurchaseOrder { get; set; } = null!;
    public Product       Product       { get; set; } = null!;
}
