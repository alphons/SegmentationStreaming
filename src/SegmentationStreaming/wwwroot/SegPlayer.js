'use strict';

// SegPlayer.js v1.4 (C) 2022,2023,2024,2025 Alphons van der Heijden

async function PlayVideoAsync(m3u8)
{
	const video = document.getElementById("video");
	const ms = new MediaSource();
	const objectURL = window.URL.createObjectURL(ms);
	video.src = objectURL;

	ms.addEventListener('sourceopen', async function () { await sourceopenasync(ms, m3u8, video, objectURL) }, { once: true });

	async function sourceopenasync(ms, m3u8, video, objectURL)
	{
		const mimeType = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
		if (!MediaSource.isTypeSupported(mimeType))
			throw new Error("Unsupported codecs");

		const sb = ms.addSourceBuffer(mimeType);
		sb.mode = "sequence";

		const queue = [];
		const hist = [];
		var storedLastModified;

		var baseUrl = m3u8.substring(0, m3u8.lastIndexOf("/") + 1);

		async function appendBufferAsync(buffer)
		{
			if (sb.updating)
			{
				await new Promise(resolve => sb.addEventListener('updateend', resolve, { once: true }));
			}
			return new Promise(resolve =>
			{
				sb.addEventListener('updateend', resolve, { once: true });
				sb.appendBuffer(buffer);
			});
		}

		try
		{
			while (ms.readyState === "open")
			{
				const resp = await fetch(m3u8, { method: 'HEAD' });
				const lastModified = resp.headers.get('Last-Modified');

				if (lastModified !== storedLastModified)
				{
					storedLastModified = lastModified;

					const resp = await fetch(m3u8);
					if (resp.ok === false)
						break;

					const playlist = await resp.text();

					playlist.split(/\r?\n/).forEach(function (line)
					{
						if (queue.length === 0 && hist.length === 0)
						{
							if (line.startsWith('#EXT-X-MAP:URI="'))
								queue.push(line.substring(16, line.length - 1));
						}
						if (line.endsWith(".m4s"))
						{
							if (hist.indexOf(line) < 0)
							{
								queue.push(line);
								hist.push(line);
								if (hist.length > 10)
									hist.shift();
							}
						}
					});
				}

				while (queue.length > 0)
				{
					const bufferedEnd = sb.buffered.length > 0 ? sb.buffered.end(sb.buffered.length - 1) : 0;
					if (bufferedEnd - video.currentTime > 5)
						break;
					const segment = await fetch(baseUrl + queue.shift());
					if (segment.ok)
					{
						const buffer = await segment.arrayBuffer();
						await appendBufferAsync(buffer);
					}
				}
				
				await new Promise(x => setTimeout(x, 2000));
			}
		}
		catch (err)
		{
			console.error("Streaming error:", err);
		} finally
		{
			ms.endOfStream();
			window.URL.revokeObjectURL(objectURL);
			video.pause();
			video.removeAttribute('src');
			video.load();
			document.dispatchEvent(new Event("VideoEnded"));
		}
	}
}
