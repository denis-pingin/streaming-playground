import handler from "../../libs/handler-lib";
import {getPools} from "../../libs/pool-lib";

export const main = handler(async (event, context) => {
  return getPools();
});
