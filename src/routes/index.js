const express = require('express');
const StreamChat = require('stream-chat').StreamChat;
const router = express.Router();

const client = StreamChat.getInstance(
  '4vssqkv2jjvq',
  'k4frmwypmwnq7a6y7tpkupz238mevjdpy7m4yaaf53vjcrf84dcdnxy2ggv8nbr2'
);

const handleSyncUsers = async (users) => {
  try {
    const formattedUserList = users.map((user, index) => {
      return {
        id: user.profileId,
        ...user,
      };
    });
    console.log('formattedUserList', formattedUserList);
    const response = await client.upsertUsers([...formattedUserList]);
    console.log({ response });
    return response;
  } catch (error) {
    console.log('handleSyncUsers caught', error);
  }
};

const handleFindChannelById = async (channelId) => {
  try {
    const filter = { type: 'messaging', cid: { $eq: channelId } };
    const sort = [{ last_message_at: -1 }];

    const channels = await client.queryChannels(filter, sort, {
      watch: false, // default is true but set to false to avoid websocket connection error
      state: true,
    });

    channels.map((channel) => {
      console.log(channel, channel.cid);
    });
    return channels[0];
  } catch (error) {
    console.log('handleFindChannelById caught', error);
  }
};

router.get('/', (req, res) => {
  res.send({ message: 'Hello world' });
});

router.post('/get-token', (req, res) => {
  try {
    console.log({ req: req.body });
    const token = client.createToken(req.body.user_id);
    res.json(token);
  } catch (error) {
    console.log(error);
  }
});

router.post('/sync-users', async (req, res) => {
  //updates or creates user accounts
  try {
    const reqBody = req.body;
    console.log({ reqBody });
    const syncedUsers = await handleSyncUsers(reqBody.members);
    res.json(syncedUsers);
  } catch (error) {
    console.log('sync users', { error });
  }
});

router.post('/create-channel', async (req, res) => {
  //create new channel for conversation
  //sync users data
  //define channel
  //create channel
  try {
    const reqBody = req.body;
    console.log({ reqBody });
    await handleSyncUsers(reqBody.members);
    const channel = await client.channel('messaging', reqBody.channelId, {
      name: reqBody.channelName,
      members: reqBody.memberIds,
      created_by_id: reqBody.createdBy,
    });
    await channel.create();
    console.log('created channel', channel);
    res.json(channel.cid);
  } catch (error) {
    console.log('createChannel caught', error);
  }
});

router.post('/rename-channel', async (req, res) => {
  //add members to created channel
  //sync users to add
  //find channel by id
  //add members to channel
  //return channel id
  try {
    const reqBody = req.body;
    const { channelId, name } = req.body;
    const channel = await handleFindChannelById(reqBody.channelId);
    await channel.updatePartial({ set: { name: name } });
    res.json(channel.cid);
  } catch (error) {
    console.log('add members caught', error);
  }
});

router.post('/add-members', async (req, res) => {
  //add members to created channel
  //sync users to add
  //find channel by id
  //add members to channel
  //return channel id
  try {
    const reqBody = req.body;
    await handleSyncUsers(reqBody.members);
    const channel = await handleFindChannelById(reqBody.channelId);
    const memberIds = req.body.members.map((member) => {
      return member.profileId;
    });
    console.log('add members', { memberIds, channel });
    await channel.addMembers(memberIds);
    // await channel.removeMembers(['tommaso']);
    res.json(channel.cid);
  } catch (error) {
    console.log('add members caught', error);
  }
});

router.post('/remove-members', async (req, res) => {
  //remove members from channel
  //find channel by id
  //remove members from channel
  //return channel id
  try {
    const reqBody = req.body;
    const { memberIds, channelId } = reqBody;
    const channel = await handleFindChannelById(reqBody.channelId);

    console.log('remove members', { memberIds });
    await channel.removeMembers(memberIds);
    // await channel.removeMembers(['tommaso']);
    res.json(channel.cid);
  } catch (error) {
    console.log('remove members caught', error);
  }
});

router.post('/delete-channel', async (req, res) => {
  //delete channel
  //find channel by id
  //delete channel
  try {
    const reqBody = req.body;
    console.log({ reqBody });

    const channel = await handleFindChannelById(reqBody.channelId);
    const response = await channel.delete();
    console.log({ response });

    res.json(response);
  } catch (error) {
    console.log('delete channel', { error });
  }
});

module.exports = router;
