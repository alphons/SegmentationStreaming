'use strict';
// c:\ffmpeg\ffmpeg -y -i "....mp4" -c:v copy -c:a copy -hls_time 4 -hls_playlist_type vod -hls_segment_type fmp4 -hls_segment_filename "d:/videos/ex/v%d.m4s" "d:/videos/ex/prog_index.m3u8"

var ms;
var req;
var tid;
var eof;
var queue;
var sourceBuffer;

const progressbalk = document.getElementById("progressbalk");
const video = document.getElementById("video");

(function ()
{
	location.href = "SegPlayer.htm";
	PageEvents();
	Init();
})();

function PageEvents()
{
	video.on("progress", function (e)
	{
		console.log(e);
	});

	document.addEventListener("click", function (e)
	{
		if (typeof window[e.target.id] === "function")
			window[e.target.id].call(e, e);
	});
}

function Init()
{
	LoadVideo();
}

function LoadVideo()
{
	eof = false;
	queue = [];
	clearTimeout(tid);
	req = new XMLHttpRequest();
	req.responseType = "arraybuffer";
	req.onload = function ()
	{
		if (this.status !== 200 && this.status !== 204 && this.status !== 304)
		{
			eof = true;
			return;
		}
		queue.push(new Uint8Array(req.response));
	}
	ms = new MediaSource();
	ms.addEventListener('sourceopen', sourceopen, false);

	video.src = window.URL.createObjectURL(ms);
}

function sourceopen()
{
	sourceBuffer = ms.addSourceBuffer('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
	sourceBuffer.mode = "sequence";

	GetVideo(true);
}

function GetVideo(init)
{
	var url = "/Video/live";
	if (init)
		url = "/Video/init";
	if (eof === false)
	{
		req.open("GET", url, true);
		req.send();
	}
	while (sourceBuffer.updating === false && queue.length > 0)
	{
		sourceBuffer.appendBuffer(queue.shift());
	}
	//progressbalk.innerText = video.currentTime;
	if (eof === false || sourceBuffer.updating || queue.length > 0)
		tid = setTimeout(GetVideo, 1000, false);
}
