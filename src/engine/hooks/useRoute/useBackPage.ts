import bridge from "@vkontakte/vk-bridge";
import { throttle } from "throttle-debounce";
import { useCallbackState, useCallbackValue } from "engine";

import {
    APP_HISTORY,
    ACTIVE_VIEW,
    ACTIVE_PANEL,
    ACTIVE_PAGE,
    ACTIVE_MODAL,
    ACTIVE_POPOUT,
} from "engine/state";

const useBackPage = () => {
    const getHistory = useCallbackValue(APP_HISTORY);
    const getView = useCallbackValue(ACTIVE_VIEW);
    const [getPanel, setPanel] = useCallbackState(ACTIVE_PANEL);
    const [getPage, setPage] = useCallbackState(ACTIVE_PAGE);
    const [getModal, setModal] = useCallbackState(ACTIVE_MODAL);
    const [getPopout, setPopout] = useCallbackState(ACTIVE_POPOUT);

    const backPage = throttle(250, async (forceBack: boolean = false, closeLowLevel: boolean = false, count: number = 1) => {

        const activeHistory = await getHistory();
        const activeView = await getView();
        const activePanel = await getPanel();
        const activePage = await getPage();
        const activeModal = await getModal();
        const activePopout = await getPopout();

        let activeSection = activeHistory.get(activeView)!;
        let newSection = [];

        if (closeLowLevel) { // Закрывает все вторастипенное.
            let deleteToEnd = 0;
            for (let i = activeSection.length; i >= 1; i--) {
                if (activeSection[i]?.activePopout || activeSection[i]?.activeModal) {
                    deleteToEnd++;
                }
            }
            newSection = activeSection.slice(0, (deleteToEnd * -1));
        } else {
            newSection = activeSection.slice(0, -1);
        };

        if (activeSection.length === 1 && !closeLowLevel) {
            bridge.send("VKWebAppClose", { "status": "success" });
        } else if (activeSection.length > 1) {
            let newStory = (newSection[newSection.length - count]);
            if (!activeSection[activeSection.length - count].ignoreBack || forceBack) {
                activeHistory.set(activeView, newSection);
                activePanel !== newStory.activePanel && setPanel(newStory.activePanel);
                activePage !== newStory.activePage && setPage(newStory.activePage);
                activeModal !== newStory.activeModal && setModal(newStory.activeModal);
                activePopout !== newStory.activePopout && setPopout(newStory.activePopout);
            } else {
                window.history.pushState(undefined, "");
            };
        };

    });

    return backPage;
}

export default useBackPage;
