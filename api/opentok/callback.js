import handler from "../../libs/handler-lib";
import {handleOpenTokEvent, saveOpenTokEvent} from "../../libs/opentok-lib";

export const main = handler(async (event, context) => {
  try {
    const data = JSON.parse(event.body);

    console.log("OpenTok event:", data);

    await saveOpenTokEvent(data);
    await handleOpenTokEvent(data);
  } catch (e) {
    console.log(e);
  }
});
