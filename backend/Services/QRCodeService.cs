using QRCoder;

namespace InventorySystem.Services;

public interface IQRCodeService
{
    string GenerateProductQR(int productId, string productName, string? sku);
}

public class QRCodeService : IQRCodeService
{
    public string GenerateProductQR(int productId, string productName, string? sku)
    {
        var content = $"PRODUCT|{productId}|{productName}|{sku ?? "NO-SKU"}";
        using var qrGenerator = new QRCodeGenerator();
        using var qrData      = qrGenerator.CreateQrCode(content, QRCodeGenerator.ECCLevel.Q);
        using var qrCode      = new PngByteQRCode(qrData);
        var bytes             = qrCode.GetGraphic(10);
        return Convert.ToBase64String(bytes);
    }
}
