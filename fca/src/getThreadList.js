"use strict";

var utils = require("../utils");
var log = require("npmlog");

function formatThread(messageThread) {
  var threadID = messageThread.thread_key
    ? (messageThread.thread_key.thread_fbid || messageThread.thread_key.other_user_id)
    : messageThread.threadID;

  var lastMessage = messageThread.last_message;
  var snippetText = lastMessage && lastMessage.nodes && lastMessage.nodes[0]
    ? lastMessage.nodes[0].snippet : null;
  var snippetID = lastMessage && lastMessage.nodes && lastMessage.nodes[0] &&
    lastMessage.nodes[0].message_sender && lastMessage.nodes[0].message_sender.messaging_actor
    ? lastMessage.nodes[0].message_sender.messaging_actor.id : null;

  var lastReadReceipt = messageThread.last_read_receipt;
  var lastReadTimestamp = lastReadReceipt && lastReadReceipt.nodes && lastReadReceipt.nodes[0]
    ? lastReadReceipt.nodes[0].timestamp_precise : null;

  return {
    threadID: threadID,
    name: messageThread.name,
    unreadCount: messageThread.unread_count,
    messageCount: messageThread.messages_count,
    imageSrc: messageThread.image ? messageThread.image.uri : null,
    emoji: messageThread.customization_info ? messageThread.customization_info.emoji : null,
    color: messageThread.customization_info && messageThread.customization_info.outgoing_bubble_color
      ? messageThread.customization_info.outgoing_bubble_color.slice(2) : null,
    nicknames: messageThread.customization_info && messageThread.customization_info.participant_customizations
      ? messageThread.customization_info.participant_customizations.reduce(function (res, val) {
          if (val.nickname) res[val.participant_id] = val.nickname;
          return res;
        }, {})
      : {},
    muteUntil: messageThread.mute_until,
    participants: messageThread.all_participants
      ? messageThread.all_participants.edges.map(function (d) {
          return {
            accountType: d.node.messaging_actor.__typename,
            userID: utils.formatID(d.node.messaging_actor.id.toString()),
            name: d.node.messaging_actor.name,
            shortName: d.node.messaging_actor.short_name,
            username: d.node.messaging_actor.username,
            gender: d.node.messaging_actor.gender,
            url: d.node.messaging_actor.url,
            bigImageSrc: d.node.messaging_actor.big_image_src ? d.node.messaging_actor.big_image_src.uri : null,
            searchTokens: d.node.messaging_actor.search_tokens,
            isViewerFriend: d.node.messaging_actor.is_viewer_friend,
            isMessengerUser: d.node.messaging_actor.is_messenger_user,
            isVerified: d.node.messaging_actor.is_verified,
            isMessageBlockedByViewer: d.node.messaging_actor.is_message_blocked_by_viewer
          };
        })
      : [],
    adminIDs: messageThread.thread_admins || [],
    approvalMode: Boolean(messageThread.approval_mode),
    reactionsMuteMode: messageThread.reactions_mute_mode
      ? messageThread.reactions_mute_mode.toLowerCase() : null,
    mentionsMuteMode: messageThread.mentions_mute_mode
      ? messageThread.mentions_mute_mode.toLowerCase() : null,
    isGroup: messageThread.thread_type === "GROUP",
    isArchived: messageThread.has_viewer_archived,
    isSubscribed: messageThread.is_viewer_subscribed,
    folder: messageThread.folder,
    cannotReplyReason: messageThread.cannot_reply_reason,
    isPinProtected: messageThread.is_pin_protected,

    // Legacy fields
    participantIDs: messageThread.all_participants
      ? messageThread.all_participants.edges.map(function (d) {
          return d.node.messaging_actor.id;
        })
      : [],
    snippet: snippetText,
    snippetSender: snippetID,
    snippetAttachments: [],
    serverTimestamp: messageThread.updated_time_precise,
    timestamp: messageThread.updated_time_precise,
    isCanonicalUser: messageThread.is_canonical_neo_user,
    isCanonical: messageThread.thread_type !== "GROUP",
    recipientsLoadable: true,
    hasEmailParticipant: false,
    readOnly: false,
    canReply: messageThread.cannot_reply_reason == null,
    lastMessageTimestamp: lastMessage ? lastMessage.timestamp_precise : null,
    lastMessageType: "message",
    lastReadTimestamp: lastReadTimestamp,
    threadType: messageThread.thread_type === "GROUP" ? 2 : 1
  };
}

module.exports = function (defaultFuncs, api, ctx) {
  return function getThreadList(limit, timestamp, tags, callback) {
    var resolveFunc = function () {};
    var rejectFunc = function () {};
    var returnPromise = new Promise(function (resolve, reject) {
      resolveFunc = resolve;
      rejectFunc = reject;
    });

    if (utils.getType(tags) === "Function") {
      callback = tags;
      tags = ["INBOX"];
    }
    if (utils.getType(timestamp) === "Function") {
      callback = timestamp;
      timestamp = null;
      tags = ["INBOX"];
    }
    if (!callback) {
      callback = function (err, data) {
        if (err) return rejectFunc(err);
        resolveFunc(data);
      };
    }

    if (!tags || tags.length === 0) tags = ["INBOX"];

    var form = {
      "av": ctx.globalOptions.pageID || ctx.userID,
      "__user": ctx.userID,
      "queries": JSON.stringify({
        "o0": {
          "doc_id": "3336396659757871",
          "query_params": {
            "limit": limit || 20,
            "before": timestamp || null,
            "tags": tags,
            "includeDeliveryReceipts": true,
            "includeSeqID": false
          }
        }
      })
    };

    defaultFuncs
      .post("https://www.facebook.com/api/graphqlbatch/", ctx.jar, form)
      .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
      .then(function (resData) {
        if (!resData || utils.getType(resData) !== "Array") throw { error: "getThreadList: response was not an array", res: resData };
        if (resData[resData.length - 1].error_results > 0) throw resData[0].o0.errors;
        if (resData[resData.length - 1].successful_results === 0) throw { error: "getThreadList: no successful_results", res: resData };

        var threads = resData[0].o0.data.viewer.message_threads.nodes;
        callback(null, threads.map(formatThread));
      })
      .catch(function (err) {
        log.error("getThreadList", err);
        callback(err);
      });

    return returnPromise;
  };
};
