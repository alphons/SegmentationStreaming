'use strict';

// SegPlayer.js v1.3 (C) 2022 Alphons van der Heijden

async function PlayVideoAsync(m3u8)
{
	const video = document.getElementById("video");
	const ms = new MediaSource();
	ms.addEventListener('sourceopen', async function () { await sourceOpen(m3u8, ms, objectURL, video) }, { once: true });
	const objectURL = window.URL.createObjectURL(ms);
	video.src = objectURL;

	async function sourceOpen(m3u8, ms, objectURL, video)
	{
		const sb = ms.addSourceBuffer('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
		sb.mode = "sequence";

		const baseUrl = m3u8.substring(0, m3u8.lastIndexOf("/") + 1);
		const queue = new Set();
		const history = new Set();

		while (true)
		{
			const resp = await fetch(m3u8);
			if (resp.ok === false)
				break;

			const playlist = await resp.text();

			playlist.split(/\n/).forEach(function (line)
			{
				if (line.startsWith('#EXT-X-MAP:URI="'))
				{
					const uri = line.slice(16, -1);
					if (!history.has(uri)) queue.add(uri);
				} else if (line.endsWith(".m4s") && !history.has(line))
				{
					queue.add(line);
				}
			});

			for (let i = 0; i < 10 && queue.size > 0; i++)
			{
				const line = queue.values().next().value;
				queue.delete(line);
				history.add(line);
				if (history.size > 10) history.delete(history.values().next().value);

				const resp = await fetch(baseUrl + line);
				if (resp.ok)
				{
					const buffer = await resp.arrayBuffer();
					if (!sb.updating) sb.appendBuffer(buffer);
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


