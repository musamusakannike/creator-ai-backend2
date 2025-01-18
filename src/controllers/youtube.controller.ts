import { Request, Response, NextFunction } from "express";
import { google } from "googleapis";

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
