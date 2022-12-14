//
// (c) 2022, Alphons van der Heijden
//

using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
	// the 'real' root of the application
	ContentRootPath = AppDomain.CurrentDomain.BaseDirectory
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

provider.Mappings[".ts"] = "video/MP2T";
provider.Mappings[".m3u8"] = "application/x-mpegURL";
provider.Mappings[".m4s"] = "video/iso.segment";
provider.Mappings[".mpd"] = "application/dash+xml";
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
