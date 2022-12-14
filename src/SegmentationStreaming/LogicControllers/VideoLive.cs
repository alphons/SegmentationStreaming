
using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace LogicControllers.Web;

public partial class StreamController : ControllerBase
{
	[HttpGet]
	[Route("~/Video/init")]
	public async Task<IActionResult> VideoInit()
	{
		Response.Headers.CacheControl = "no-cache";

		var unixSeconds = (int)DateTimeOffset.Now.ToUnixTimeSeconds();

		HttpContext.Session.SetString("nr", "-1"); // 145 for the end
		HttpContext.Session.SetInt32("ac", unixSeconds);

		await HttpContext.Session.CommitAsync();

		var fileName = $@"d:\Videos\ex\init.mp4";

		Debug.WriteLine($"{fileName}");

		if (!System.IO.File.Exists(fileName))
			return NotFound();

		return PhysicalFile(fileName, "application/octet-stream");
	}

	[HttpGet]
	[Route("~/Video/live")]
	public async Task<IActionResult> VideoLive()
	{
		Response.Headers.CacheControl = "no-cache";

		var unixSeconds = (int)DateTimeOffset.Now.ToUnixTimeSeconds();
		var ac = HttpContext.Session.GetInt32("ac");
		if ((unixSeconds - ac) < 2) // example only one file per 2 seconds
			return NoContent();

		HttpContext.Session.SetInt32("ac", unixSeconds);

		var intNr = 0;
		var nr = HttpContext.Session.GetString("nr");
		if (nr != null)
		{
			if(int.TryParse(nr, out intNr))
				intNr++;
		}
		HttpContext.Session.SetString("nr", intNr.ToString());

		await HttpContext.Session.CommitAsync();

		var fileName = $@"d:\Videos\ex\v{intNr}.m4s";

		Debug.WriteLine($"{fileName}");

		if (!System.IO.File.Exists(fileName))
			return NotFound();

		return PhysicalFile(fileName, "application/octet-stream");
	}
}
