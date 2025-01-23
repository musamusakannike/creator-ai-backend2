import { Request, Response, NextFunction } from "express";
import { google, youtube_v3 } from "googleapis";

export const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = (req as any).user;

    if (!user.youtubeAccessToken) {
      res.status(400).json({ message: "No YouTube access token found" });
      return;
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: user.youtubeAccessToken,
    });

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });
    const youtubeAnalytics = google.youtubeAnalytics({
      version: "v2",
      auth: oauth2Client,
    });

    // Fetch channel details
    const channelResponse = await youtube.channels.list({
      part: ["snippet", "statistics"],
      mine: true,
    });

    const channel = channelResponse.data.items?.[0];
    if (!channel) {
      res.status(404).json({ message: "Channel not found" });
      return;
    }

    const channelLogo = channel.snippet?.thumbnails?.default?.url || "";
    const channelName = channel.snippet?.title || "";
    const subscribers = channel.statistics?.subscriberCount || "0";

    // Fetch analytics for the last 28 days
    const analyticsResponse = await youtubeAnalytics.reports.query({
      ids: "channel==MINE",
      startDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      metrics: "views,estimatedMinutesWatched",
      dimensions: "day",
    });

    const totalViews =
      analyticsResponse.data.rows?.reduce(
        (sum: number, row: any[]) => sum + parseInt(row[1], 10),
        0
      ) || 0;
    const totalWatchTime =
      analyticsResponse.data.rows?.reduce(
        (sum: number, row: any[]) => sum + parseInt(row[2], 10),
        0
      ) || 0;

    // Fetch latest videos
    const videosResponse = await youtube.search.list({
      part: ["snippet"],
      channelId: channel.id || "",
      maxResults: 5,
      order: "date",
    });

    const latestVideos = await Promise.all(
      (videosResponse.data.items || []).map(async (video: any) => {
        const videoId = video.id?.videoId || "";
        const statsResponse = await youtube.videos.list({
          part: ["statistics"],
          id: [videoId],
        });

        const stats = statsResponse.data.items?.[0]?.statistics || {};
        return {
          title: video.snippet?.title || "",
          thumbnail: video.snippet?.thumbnails?.default?.url || "",
          views: stats.viewCount || 0,
          likes: stats.likeCount || 0,
          comments: stats.commentCount || 0,
        };
      })
    );

    // Fetch latest comments
    const commentsResponse = await youtube.commentThreads.list({
      part: ["snippet"],
      maxResults: 5,
      order: "time",
      allThreadsRelatedToChannelId: channel.id || "",
    });

    const latestComments = (commentsResponse.data.items || []).map(
      (comment: any) => ({
        author:
          comment.snippet?.topLevelComment?.snippet?.authorDisplayName || "",
        text: comment.snippet?.topLevelComment?.snippet?.textDisplay || "",
        publishedAt:
          comment.snippet?.topLevelComment?.snippet?.publishedAt || "",
      })
    );

    res.json({
      channelLogo,
      channelName,
      subscribers,
      totalViews,
      totalWatchTime,
      latestVideos,
      latestComments,
    });
  } catch (error) {
    console.error("YouTube Analytics Error:", error);
    next(error); // Pass the error to the next middleware
  }
};


export const getAllChannelContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user

    if (!user.youtubeAccessToken) {
      res.status(400).json({ message: "No YouTube access token found" })
      return
    }

    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({
      access_token: user.youtubeAccessToken,
    })

    const youtube = google.youtube({ version: "v3", auth: oauth2Client })

    // Validate query parameters
    const contentType = req.query.type as string | undefined
    const pageToken = req.query.pageToken ? String(req.query.pageToken) : undefined

    // Fetch channel details to ensure we're using the correct channel ID
    const channelResponse = await youtube.channels.list({
      part: ["snippet"],
      mine: true,
    })

    const channel = channelResponse.data.items?.[0]
    if (!channel || !channel.id) {
      res.status(404).json({ message: "Channel not found" })
      return
    }

    const channelId = channel.id
    if (!contentType) {
      res.status(400).json({ message: "Content type is required" })
      return
    }

    let responseData: any[] = []

    if (contentType === "videos" || contentType === "shorts" || contentType === "liveStreams") {
      const videoResponse = await youtube.search.list({
        part: ["snippet"],
        channelId,
        maxResults: 10,
        order: "date",
        type: ["video"],
        eventType: contentType === "liveStreams" ? "live" : undefined,
        pageToken,
      })

      responseData = await Promise.all(
        (videoResponse.data.items || []).map(async (video: youtube_v3.Schema$SearchResult) => {
          const videoId = video.id?.videoId
          if (!videoId) return null

          const statsResponse = await youtube.videos.list({
            part: ["statistics"],
            id: [videoId],
          })

          const stats = statsResponse.data.items?.[0]?.statistics || {}
          const item = {
            title: video.snippet?.title || "",
            thumbnail: video.snippet?.thumbnails?.default?.url || "",
            type: contentType === "liveStreams" ? "live" : "video",
            views: stats.viewCount || "0",
            likes: stats.likeCount || "0",
            comments: stats.commentCount || "0",
            publishedAt: video.snippet?.publishedAt || "",
          }

          return contentType === "shorts" ? (item.title.toLowerCase().includes("shorts") ? item : null) : item
        }),
      )

      responseData = responseData.filter(Boolean)

      res.json({
        content: responseData,
        nextPageToken: videoResponse.data.nextPageToken || null,
        prevPageToken: videoResponse.data.prevPageToken || null,
      })
    } else if (contentType === "posts") {
      const postsResponse = await youtube.search.list({
        part: ["snippet"],
        channelId,
        maxResults: 10,
        type: ["video"],
        pageToken,
      })

      responseData = (postsResponse.data.items || []).map((post: youtube_v3.Schema$SearchResult) => ({
        title: post.snippet?.title || "",
        thumbnail: post.snippet?.thumbnails?.default?.url || "",
        type: "post",
        publishedAt: post.snippet?.publishedAt || "",
      }))

      res.json({
        content: responseData,
        nextPageToken: postsResponse.data.nextPageToken || null,
        prevPageToken: postsResponse.data.prevPageToken || null,
      })
    } else {
      res.status(400).json({ message: "Invalid content type" })
    }
  } catch (error) {
    console.error("YouTube Channel Content Error:", error)
    next(error)
  }
}

