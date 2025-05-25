# SegmentationStreaming
Smallest live-video streaming javascript implementation

## The Others

As of februari 2023:

- hls.js 337kB
- video.js 571kB
- dash.js 713kB
- SegPlayer.js 3kB


## Server (example for live event streaming)

In this solution a .NET Core 7 testing framework is used, but is not needed for the client javascript for playing live video streams.

For making segments from a (live event or videofile) video/audio source the following ffmpeg command line can be used:

```
ffmpeg -re -i "..." 
   -c copy -flags -global_header 
   -hls_time 4 
   -hls_list_size 5 
   -master_pl_publish_rate 1 
   -hls_flags delete_segments
   -hls_segment_type fmp4 
   -hls_segment_filename "r:/KEY%d.m4s" 
   -hls_fmp4_init_filename "KEY.mp4" "r:/KEY.m3u8"
```

When using mpeg source this produce segments of data which can be served bij a webserver.

The m3u8 file is a playlist showing the latest 5 segments. Earlier segments are automatically deleted. 

## SegPlayer.js

On the client side only the URL of the m3u8 file is used.

The script loads the m3u8 file and initaly searches for the init entry.

This init segment is fed to the media element on the webpage once.

After this, the script loads the m3u8 file on a regular basis (once every second) searches for new segments, if any, and these are also added to te media element.

When experiencing a 404 (not found), the script terminates.

The javascript is programmed asynchronous.

```javascript
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
				if(!video.error)
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
			if (ms.readyState === "open" && !video.error)
				ms.endOfStream();
			window.URL.revokeObjectURL(objectURL);
			video.pause();
			video.removeAttribute('src');
			video.load();
			document.dispatchEvent(new Event("VideoEnded"));
		}
	}
}
```

Demo html page

```html
<!doctype html>
<html lang="en">
<head>
	<title>Just Testing de Segway</title>
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta charset="utf-8" />

	<link href="SegPlayer.css" rel="stylesheet" />
	<script src="SegPlayer.js" defer></script>
	<script>
		document.addEventListener('VideoEnded', function ()
		{
			console.log('The video has ended')
		});
		document.addEventListener('DOMContentLoaded', async function ()
		{
			await PlayVideoAsync('http://seg.djpodium.com/ex/index.m3u8');
		});
	</script>
</head>
<body>
	<div class="vid-container">
		<video id="video" autoplay="autoplay" muted controls></video>
	</div>
</body>
</html>
```

Demo CSS
```css
html
{
	box-sizing: border-box;
}

*, *:before, *:after
{
	box-sizing: inherit;
}

body
{
	background-color:black;
	padding: 0px;
	margin:0px;
	overflow-x: auto;
}

.vid-container
{
	position: absolute;
	top: 0;
	bottom: 0;
	width: 100%;
	height: 100%;
	overflow: hidden;
}

	.vid-container video
	{
		min-width: 100%;
		min-height: 100%;

		max-width: 100%;
		max-height: 100%;

		width: auto;
		height: auto;

		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%,-50%);
	}

video::-webkit-media-controls-timeline
{
	display:none;
}

video::-webkit-media-controls-current-time-display
{
	display: none;
}

video::-webkit-media-controls-time-remaining-display
{
	display: none;
}
```
