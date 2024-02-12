import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { prisma } from "../utils/index.js";

const router = express.Router();

// 팔로우 API
router.post(
  "/users/:userId/follows",
  authMiddleware,
  async (req, res, next) => {
    try {
      const followingId = req.params.userId;
      const followerId = req.user.userId;

      if (!followingId) {
        return res.status(404).json({
          success: false,
          message: "팔로우하려는 유저를 지정해주세요.",
        });
      }

      const followingUser = await prisma.users.findFirst({
        where: { userId: +followingId },
      });

      if (!followingUser) {
        return res
          .status(404)
          .json({ success: false, message: "존재하지 않는 유저입니다." });
      }

      if (+followingId === +followerId) {
        return res.status(400).json({
          success: false,
          message: "스스로를 팔로우할 수는 없습니다.",
        });
      }

      const isExistingFollowing = await prisma.follows.findFirst({
        where: { followerId: +followerId, followingId: +followingId },
      });
      //이미 팔로우 한 사람이면 언팔로우
      if (isExistingFollowing) {
        await prisma.follows.delete({
          where: {
            followId: isExistingFollowing.followId,
          },
        });

        return res.status(200).json({
          success: true,
          message: `${followingUser.nickname}님을 언팔로우했습니다.`,
        });
      }

      const follow = await prisma.follows.create({
        data: {
          followingId: +followingId,
          followerId: +followerId,
        },
      });

      return res.status(201).json({
        success: true,
        message: `${followingUser.nickname}님을 팔로우하였습니다.`,
      });
    } catch (err) {
      next(err);
    }
  }
);

// 언팔로우 API
// router.delete(
//   "/users/:userId/follows",
//   authMiddleware,
//   async (req, res, next) => {
//     try {
//       const followingId = req.params.userId;
//       const followerId = req.user.userId;

//       if (!followingId) {
//         return res.status(404).json({
//           success: false,
//           message: "언팔로우하려는 유저를 지정해주세요.",
//         });
//       }

//       const followingUser = await prisma.users.findFirst({
//         where: { userId: +followingId },
//         select: {
//           nickname: true,
//         },
//       });

//       if (!followingUser) {
//         return res
//           .status(404)
//           .json({ success: false, message: "존재하지 않는 유저입니다." });
//       }

//       const Follow = await prisma.follows.findFirst({
//         where: { followerId: +followerId, followingId: +followingId },
//         select: { followId: true },
//       });

//       if (!Follow) {
//         return res
//           .status(404)
//           .json({ success: false, message: "팔로우한 적 없는 유저입니다." });
//       }

//       const unfollow = await prisma.follows.delete({
//         where: {
//           followId: Follow.followId,
//         },
//       });

//       return res.status(200).json({
//         success: true,
//         message: `${followingUser.nickname}님을 언팔로우하였습니다.`,
//       });
//     } catch (err) {
//       next(err);
//     }
//   }
// );

//해당 유저의 팔로잉 목록보기
router.get("/users/:userId/following", async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "userId는 필수로 입력되어야합니다." });
    }

    const user = await prisma.users.findFirst({
      where: { userId: +userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "해당 유저를 찾을 수 없습니다.",
      });
    }

    const followingList = await prisma.follows.findMany({
      where: { followerId: +userId },
      select: {
        followingId: true,
        followingUser: {
          select: {
            nickname: true,
          },
        },
      },
      orderBy: { followId: "desc" },
    });

    followingList.forEach((follows) => {
      follows.nickname = follows.followingUser.nickname;
      delete follows.followingUser;
    });

    // if (!followingList ) { //>>> 조건식이 이상한듯. 결과가 안나옴
    //   followingList = "아직 팔로우한 사람이 없습니다."; //이거 넣을거면 위에 const followingList >> let으로 바꿔줘야함.
    // }

    return res.status(200).json({ success: true, data: followingList });
  } catch (err) {
    next(err);
  }
});

//해당 유저의 팔로워 목록보기
router.get("/users/:userId/follower", async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "userId는 필수로 입력되어야합니다." });
    }

    const user = await prisma.users.findFirst({
      where: { userId: +userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "해당 유저를 찾을 수 없습니다.",
      });
    }

    const followerList = await prisma.follows.findMany({
      where: { followingId: +userId },
      select: {
        followerId: true,
        followerUser: {
          select: {
            nickname: true,
          },
        },
      },
      orderBy: { followId: "desc" },
    });

    followerList.forEach((follows) => {
      follows.nickname = follows.followerUser.nickname;
      delete follows.followerUser;
    });

    // if (!followerList ) { //>>> 조건식이 이상한듯. 결과가 안나옴
    //   followerList = "아직 팔로우한 사람이 없습니다."; //이거 넣을거면 위에 const followerList >> let으로 바꿔줘야함.
    // }

    return res.status(200).json({ success: true, data: followerList });
  } catch (err) {
    next(err);
  }
});

export default router;
