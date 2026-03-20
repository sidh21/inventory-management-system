namespace InventorySystem.Models;

public class AuditLog
{
    public int      Id         { get; set; }
    public string   Action     { get; set; } = string.Empty;   // CREATE | UPDATE | DELETE | LOGIN
    public string   Entity     { get; set; } = string.Empty;   // Product | User | etc.
    public string?  EntityId   { get; set; }
    public string?  OldValues  { get; set; }
    public string?  NewValues  { get; set; }
    public string   PerformedBy { get; set; } = string.Empty;
    public string   IpAddress  { get; set; } = string.Empty;
    public DateTime CreatedAt  { get; set; } = DateTime.UtcNow;
}

public class Notification
{
    public int      Id        { get; set; }
    public string   Title     { get; set; } = string.Empty;
    public string   Message   { get; set; } = string.Empty;
    public string   Type      { get; set; } = "info"; // info | warning | danger | success
    public bool     IsRead    { get; set; } = false;
    public string?  Link      { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
