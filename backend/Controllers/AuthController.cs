using InventorySystem.Data;
using InventorySystem.DTOs;
using InventorySystem.Models;
using InventorySystem.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InventorySystem.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IJwtService  _jwt;

    public AuthController(AppDbContext db, IJwtService jwt)
    {
        _db  = db;
        _jwt = jwt;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.Password))
            return Unauthorized(new { message = "Invalid email or password" });

        var token = _jwt.GenerateToken(user);
        return Ok(new AuthResponseDto(token, user.Name, user.Email, user.Role));
    }

    [HttpPost("register")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (await _db.Users.AnyAsync(u => u.Email == dto.Email))
            return BadRequest(new { message = "Email already exists" });

        var user = new User
        {
            Name     = dto.Name,
            Email    = dto.Email,
            Password = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role     = dto.Role
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return Ok(new { message = "User created successfully" });
    }

    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        var name  = User.Identity?.Name ?? "";
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "";
        var role  = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "";
        return Ok(new { name, email, role });
    }
}
