using CAESAR.Server.Data;
using CAESAR.Server.DTOs;
using CAESAR.Server.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Security.Cryptography;
using System.Security.Claims;
using System.Text;
using System.IdentityModel.Tokens.Jwt;

namespace CAESAR.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        public AuthController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest("Имя пользователя или почта не может быть пустой");
            }

            var userExist = await _context.Users.AnyAsync(u => u.Email == dto.Email);
            if (userExist) return BadRequest("Пользователь с такой почтой уже зарегестрирован");

            var nextUser = new User
            {
                UserName = dto.Username,
                Email = dto.Email,
            };

            var passwordHasher = new PasswordHasher<User>();

            string secureHash = passwordHasher.HashPassword(nextUser, dto.Password);

            nextUser.PasswordHash = secureHash;

            _context.Users.Add(nextUser);
            await _context.SaveChangesAsync();

            var token = GenerateToken(nextUser);

            return Ok(new
            {
                Message = "Регистрация прошла успешно",
                Token = token,
                Username = nextUser.UserName
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password)) return BadRequest("Почта и пароль не могут быть пустыми");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null) return BadRequest("Неверная почта или пароль");

            if (user.IsBlocked) return StatusCode(403, "Аккаунт заблокирован. Обратитесь к администратору.");
            
            var passwordHasher = new PasswordHasher<User>();
            var result = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);

            if (result == PasswordVerificationResult.Failed) return BadRequest("Неверная почта или пароль");

            // Генерация JWT-токена
            var tokenString = GenerateToken(user);

            return Ok(new
            {
                Message = "Успешный вход",
                Token = tokenString,
                Username = user.UserName
            });

        }

        // Единый генератор JWT-токена для входа и авто-входа после регистрации
        private string GenerateToken(User user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretkey = jwtSettings.GetValue<string>("Secret");
            var issuer = jwtSettings.GetValue<string>("Issuer");
            var audience = jwtSettings.GetValue<string>("Issuer");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretkey!));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.UserName)
            };

            var tokenOptions = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(tokenOptions);
        }
    }
}
