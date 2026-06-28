// ============================================================
//  Единая фабрика JWT (та же логика, что в AuthController).
//  Рекомендация: вынести генерацию из AuthController сюда и
//  переиспользовать, чтобы не дублировать claims/подпись.
// ============================================================
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CAESAR.Server.Models;
using Microsoft.IdentityModel.Tokens;

namespace CAESAR.Server.Services
{
    public static class JwtTokenFactory
    {
        public static string Generate(User user, IConfiguration config, TimeSpan lifetime)
        {
            var jwt = config.GetSection("JwtSettings");
            var secret = jwt.GetValue<string>("Secret");
            var issuer = jwt.GetValue<string>("Issuer");
            var audience = jwt.GetValue<string>("Audience") ?? issuer;

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.UserName),
                new Claim("src", "telegram") // пометка источника, опционально
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.Add(lifetime),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
