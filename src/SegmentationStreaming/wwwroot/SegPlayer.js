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

		var i;
		var queue = [];
		var archive = [];
		var initsegment = '';

		var baseUrl = m3u8.substring(0, m3u8.lastIndexOf("/") + 1);

		while (true)
		{
			var playlist = await (await fetch(m3u8)).text();
			if (playlist === 'StatusCode 404')
				break;

			var lines = playlist.split(/\r?\n/);

			lines.forEach(async function (line)
			{
				if (initsegment === '')
				{
					if (line.startsWith('#EXT-X-MAP:URI="'))
					{
						initsegment = baseUrl + line.substring(16, line.length - 1);
						var initBuffer = await (await fetch(initsegment)).arrayBuffer();
						sb.appendBuffer(initBuffer);
						return;
					}
				}
				if (line.endsWith(".m4s"))
				{
					if (archive.indexOf(line) < 0)
					{
						archive.push(line);
						if (archive.length > 10)
							archive.shift();
						var segmentBuffer = await (await fetch(baseUrl + line)).arrayBuffer();
						queue.push(segmentBuffer);
					}
				}
			});

			for (i = 0; i < 10; i++)
			{
				if (queue.length == 0)
					break;

				if (sb.updating === false)
					sb.appendBuffer(queue.shift());
				await new Promise(r => setTimeout(r, 10));
			}

			await new Promise(r => setTimeout(r, 1000));
		}
	}
}


