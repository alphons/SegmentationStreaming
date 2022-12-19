# SegmentationStreaming
Smallest live-video streaming javascript implementation

## The Others

As of december 2022:

- hls.js 337kB
- video.js 571kB
- dash.js 713kB
- SegPlayer.js 2kB


## Server (example for live event streaming)

For making segments from a video/audio source the following ffmpeg command line can be used:

```
ffmpeg -re -i "..." -c copy -flags -global_header -hls_time 4 -hls_list_size 5 -master_pl_publish_rate 1 -hls_flags delete_segments -hls_segment_type fmp4 -hls_segment_filename "r:/KEY%d.m4s" -hls_fmp4_init_filename "KEY.mp4" "r:/KEY.m3u8"
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

// SegPlayer.js v1.2 (C) 2022 Alphons van der Heijden

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
		window.URL.revokeObjectURL(objectURL);
		video.pause();
		video.removeAttribute('src'); // empty source
		video.load();
		document.dispatchEvent(new Event("VideoEnded"));
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
			await PlayVideoAsync('https://djpodium.com/live/segtest.m3u8');
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
