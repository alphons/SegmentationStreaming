'use strict';

// SegPlayer.js v1.1 (C) 2022 Alphons van der Heijden

async function LoadVideoAsync(m3u8)
{
	var ms = new MediaSource();
	ms.addEventListener('sourceopen', async function () { await PlayAsync(m3u8) }, false);
	document.getElementById("video").src = window.URL.createObjectURL(ms);

	async function PlayAsync(m3u8)
	{
		var sb = ms.addSourceBuffer('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
		sb.mode = "sequence";

		var i, buffer, queue = [], hist = [];

		var baseUrl = m3u8.substring(0, m3u8.lastIndexOf("/") + 1);

		while (true)
		{
			var playlist = await (await fetch(m3u8)).text();
			if (playlist === 'StatusCode 404')
				break;

			var lines = playlist.split(/\r?\n/);

			lines.forEach(async function (line)
			{
				if (hist.length === 0)
				{
					if (line.startsWith('#EXT-X-MAP:URI="'))
					{
						line = line.substring(16, line.length - 1);
						hist.push(line)
						buffer = await (await fetch(baseUrl + line)).arrayBuffer();
						queue.push(buffer);
					}
				}
				if (line.endsWith(".m4s"))
				{
					if (hist.indexOf(line) < 0)
					{
						if (hist.length > 10)
							hist.shift();
						hist.push(line);
						buffer = await (await fetch(baseUrl + line)).arrayBuffer();
						queue.push(buffer);
					}
				}
			});

			for (i = 0; i < 10; i++)
			{
				if (queue.length == 0)
					break;

				if (sb.updating === false)
					sb.appendBuffer(queue.shift());
				await new Promise(x => setTimeout(x, 10));
			}

			await new Promise(x => setTimeout(x, 1000));
		}
	}
}


