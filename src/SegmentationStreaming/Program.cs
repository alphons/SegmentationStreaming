//
// (c) 2022,,2023,2024,2025 Alphons van der Heijden
//

using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
	ContentRootPath = AppContext.BaseDirectory
});

builder.Services
	.AddMvcCore()
	.WithMultiParameterModelBinding();
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession();

var app = builder.Build();

app.UseRouting();
app.UseSession();
app.UseDefaultFiles();

var provider = new FileExtensionContentTypeProvider();

provider.Mappings[".m3u8"] = "application/x-mpegURL";
provider.Mappings[".m4s"] = "video/iso.segment";

app.UseStaticFiles(new StaticFileOptions
{
	ContentTypeProvider = provider,
	ServeUnknownFileTypes = true,
	DefaultContentType = "text/plain" // LetsEncrypt !!
});

app.UseStaticFiles(new StaticFileOptions
{
	FileProvider = new PhysicalFileProvider(@"d:\Videos\ex"),
	RequestPath = "/ex",
	ContentTypeProvider = provider
});

app.MapControllers();

app.Run();
