'use strict';

// SegPlayer.js v1.3 (C) 2022 Alphons van der Heijden

async function PlayVideoAsync(m3u8)
{
	var video = document.getElementById("video");
	var ms = new MediaSource();
	ms.addEventListener('sourceopen', async function () { await sourceopenasync(m3u8) }, false);
	const objectURL = window.URL.createObjectURL(ms);
	video.src = objectURL;

	async function sourceopenasync(m3u8)
	{
		var sb = ms.addSourceBuffer('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
		sb.mode = "sequence";

		var i, resp, playlist, buffer, queue = [], hist = [];

		var baseUrl = m3u8.substring(0, m3u8.lastIndexOf("/") + 1);

		while (true)
		{
			resp = await fetch(m3u8);
			if (resp.ok === false)
				break;

			playlist = await resp.text();

			playlist.split(/\r?\n/).forEach(async function (line)
			{
				if (queue.length === 0 && hist.length === 0)
				{
					if (line.startsWith('#EXT-X-MAP:URI="'))
						queue.push(line.substring(16, line.length - 1));
				}
				if (line.endsWith(".m4s"))
				{
					if (hist.indexOf(line) < 0)
						queue.push(line);
				}
			});

			for (i = 0; i < 10; i++)
			{
				if (queue.length == 0)
					break;

				var line = queue.shift();
				hist.push(line);
				if (hist.length > 10)
					hist.shift();

				resp = await fetch(baseUrl + line);
				if (resp.ok)
				{
					buffer = await resp.arrayBuffer();

					if (sb.updating === false)
						sb.appendBuffer(buffer);
				}
				await new Promise(x => setTimeout(x, 10));
			}

			await new Promise(x => setTimeout(x, 2000));
		}
		document.dispatchEvent(new Event("VideoEnded"));
		window.URL.revokeObjectURL(objectURL);
		video.pause();
		video.removeAttribute('src'); // empty source
		video.load();
	}
}


