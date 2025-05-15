
rem the video contains h264 video and one stereo audio channel and one 5.1 audio channel, so we have to map stereo and convert to aac

rem copy and paste into a 'dos' box, the command script converts %03 so does not work 

c:\ffmpeg\ffmpeg -y -i "d:/videos/bbb_sunflower_1080p_30fps_normal.mp4" -map 0:v -map 0:1 -c:v copy -c:a aac -hls_time 4 -hls_playlist_type vod -hls_segment_type fmp4 -hls_segment_filename "d:/videos/ex/v%03d.m4s" "d:/videos/ex/index.m3u8"
