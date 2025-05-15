//
// (c) 2022,,2023,2024,2025 Alphons van der Heijden
//

using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
	ContentRootPath = AppContext.BaseDirectory
});

var app = builder.Build();

app.UseDefaultFiles();

var provider = new FileExtensionContentTypeProvider();

provider.Mappings[".m3u8"] = "application/x-mpegURL";
provider.Mappings[".m4s"] = "video/iso.segment";

var dir = Directory.Exists(@"d:\Videos\ex") ?
	@"d:\Videos\ex" :
	@"f:\Videos\ex";

app.UseStaticFiles(new StaticFileOptions
{
	FileProvider = new PhysicalFileProvider(dir),
	RequestPath = "/ex",
	ContentTypeProvider = provider
});

app.UseStaticFiles();

app.Run();

