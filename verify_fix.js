
const WebSocket = require('./server/node_modules/ws');

const WS_URL = 'ws://localhost:8000';

function connect(name) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(WS_URL);
        ws.on('open', () => resolve(ws));
        ws.on('error', (err) => reject(`Connection error for ${name}: ${err.message}`));
    });
}

function waitForMessage(ws, type, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            ws.removeListener('message', listener);
            reject(new Error(`Timeout waiting for message type: ${type}`));
        }, timeoutMs);

        const listener = (data) => {
            try {
                const msg = JSON.parse(data);
                if (msg.type === type) {
                    clearTimeout(timeout);
                    ws.removeListener('message', listener);
                    resolve(msg);
                }
            } catch (e) {
                // ignore parse errors
            }
        };
        ws.on('message', listener);
    });
}

async function runTest() {
    console.log('--- STARTING SECURITY TEST ---');

    try {
        // 1. Creator connects and creates room
        console.log('[1] Connecting Creator...');
        const creatorWs = await connect('Creator');

        console.log('[1] Creating room...');
        creatorWs.send(JSON.stringify({
            type: 'create_room',
            payload: { username: 'CreatorUser', userId: 'creator_uid_1' }
        }));

        const creationMsg = await waitForMessage(creatorWs, 'room_created');
        const roomId = creationMsg.payload.id;
        const creatorToken = creationMsg.payload.creatorToken;

        if (!creatorToken) {
            throw new Error('FAILED: No creatorToken received!');
        }
        console.log(`[1] Room ${roomId} created. Token: ${creatorToken}`);

        // 2. Attacker connects and joins
        console.log('[2] Connecting Attacker...');
        const attackerWs = await connect('Attacker');

        console.log('[2] Attacker joining...');
        attackerWs.send(JSON.stringify({
            type: 'join_room',
            payload: { username: 'AttackerUser', roomId, userId: 'attacker_uid_1' }
        }));
        await waitForMessage(attackerWs, 'room_update');
        console.log('[2] Attacker joined.');

        // 3. Attacker tries to start poll
        console.log('[3] Attacker attempting to start poll...');
        attackerWs.send(JSON.stringify({
            type: 'start_poll',
            payload: { roomId }
        }));

        // We expect an ERROR check
        try {
            const errorMsg = await waitForMessage(attackerWs, 'error', 2000);
            if (errorMsg.payload.message.includes('Only the room creator') || errorMsg.payload.message.includes('Unauthorized')) {
                console.log('PASSED: Attacker blocked from starting poll.');
            } else {
                console.error('FAILED: Attacker got unexpected error:', errorMsg);
            }
        } catch (e) {
            console.error('FAILED: Attacker did not receive error response (or timeout).');
        }

        // 4. Creator disconnects
        console.log('[4] Simulating Creator disconnect/refresh...');
        creatorWs.terminate();

        // Short delay to ensure server processes disconnect
        await new Promise(r => setTimeout(r, 1000));

        // 5. Creator Reconnects with Token
        console.log('[5] Creator re-connecting...');
        const creatorReconnectWs = await connect('CreatorReconnect');

        console.log(`[5] Re-joining with token: ${creatorToken}`);
        creatorReconnectWs.send(JSON.stringify({
            type: 'join_room',
            payload: {
                username: 'CreatorUser',
                roomId,
                userId: 'creator_uid_1',
                creatorToken: creatorToken
            }
        }));

        // Wait for ROLE message first
        const roleMsg = await waitForMessage(creatorReconnectWs, 'ROLE', 3000);
        console.log('[5] Received ROLE message:', JSON.stringify(roleMsg.payload));

        if (roleMsg.payload.role === 'creator') {
            console.log('PASSED: Reconnected creator received ROLE message with creator role');
        } else {
            throw new Error(`FAILED: Reconnected creator did not receive creator role! role=${roleMsg.payload.role}`);
        }

        // Wait for room_update
        const joinUpdate = await waitForMessage(creatorReconnectWs, 'room_update');
        console.log('[5] Received room_update:', JSON.stringify(joinUpdate.payload));

        if (joinUpdate.payload.isCreator === true) {
            console.log('PASSED: Reconnected creator recognized as creator (isCreator: true)');
        } else {
            throw new Error(`FAILED: Reconnected creator NOT recognized! isCreator=${joinUpdate.payload.isCreator}`);
        }

        // 6. Reconnected Creator starts poll
        console.log('[6] Reconnected Creator attempting to start poll...');
        creatorReconnectWs.send(JSON.stringify({
            type: 'start_poll',
            payload: { roomId }
        }));

        const pollStartMsg = await waitForMessage(creatorReconnectWs, 'room_update');
        if (pollStartMsg.payload.status === 'active') {
            console.log('PASSED: Reconnected creator successfully started poll.');
        } else {
            console.log('Warning: Expected status=active, got:', pollStartMsg.payload.status);
        }

        console.log('--- TEST COMPLETED SUCCESSFULLY ---');
        process.exit(0);

    } catch (err) {
        console.error('!!! TEST FAILED !!!');
        console.error(err);
        process.exit(1);
    }
}

runTest();
