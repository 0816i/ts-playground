import Redis, { Result } from "ioredis";
import { ulid } from "ulid";

const client = new Redis({
  port: 6379,
  host: "localhost",
});

client.get("test", (asdf) => {
  console.log("test");
  console.log(asdf);
});

const commandDefinition = {
  numberOfKeys: 1,
  lua: `local leaderKey = KEYS[1]
local instanceId = ARGV[1]
local timeout = tonumber(ARGV[2])
local rcall = redis.call

local leaderId = rcall('GET', leaderKey)

if (instanceId == leaderId or leaderId == false) then
  rcall('SET', leaderKey, instanceId, 'PX', timeout)
  return true
end

return false
`,
  readonly: false,
};

client.defineCommand("checkLeader", commandDefinition);

declare module "ioredis" {
  interface RedisCommander<Context> {
    checkLeader(
      key: string,
      argv1: string,
      argv2: string
    ): Result<string, Context>;
  }
}

const leaderId = ulid();

const leaderCheck = () => {
  console.log("start Leader Check");
  client.checkLeader("Test", leaderId, "5000").then(
    (value) => {
      console.log(value);
      if (value) {
        console.log("I'm leader");
      }
    },
    (err) => console.log(err)
  );

  setTimeout(leaderCheck, 2500);
};

leaderCheck();
