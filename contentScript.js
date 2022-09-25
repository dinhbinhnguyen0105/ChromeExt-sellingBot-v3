console.log('Content script start ');

const EXTEND_SELECTOR = 'div[aria-label="Xem thêm"';
const MENU_SELECTOR = 'div[role="menu"]';
const MENU_ITEM_SELECTOR = 'div[role="menuitem"]';

const LIST_IN_MORE_PLACES = 'Niêm yết ở những nơi khác';
const DATAVISUAL_SELECTOR = 'div[data-visualcompletion="ignore-dynamic"]';
const CLOSEBTN_SELECTOR = 'aria-label="Đóng"';
const POSTBTN_SELECTOR = 'aria-label="Đăng"';

document.addEventListener('click', async (e) => {
    const extendBtnElm = e.target.closest(EXTEND_SELECTOR);
    if (extendBtnElm) {
        extendBtnElm.classList.add('extendBtn');
        extendBtnElm.setAttribute('id', 'extendBtn');

        const menuElm = await waitForElm(MENU_SELECTOR);

        const menuItemElm = menuElm.querySelector(MENU_ITEM_SELECTOR);

        if (document.querySelector('#menuItemSelling')) {
            document.querySelector('#menuItemSelling').remove();
        }
        const menuItemSelling = document.createElement('div');
        menuItemSelling.setAttribute('id', 'menuItemSelling');
        menuItemSelling.setAttribute('class', '_menu-item');
        importCSS();

        menuItemSelling.innerHTML = `
        <div class="_menu-item__icon">
            <i class="fa-solid fa-wand-sparkles"></i>
        </div>
        <div class="_menu-item__msg">
            <p>Selling bot</p>
        </div>
        `;
        menuItemElm.parentElement.appendChild(menuItemSelling);
    }
});

document.addEventListener('click', async (e) => {
    if (e.target.closest('#menuItemSelling')) {
        await handleSelling();
    }
});

async function handleSelling() {
    let groupTotal = await handleGetGroups();
    const groupsPrev = [];
    await sleep(200);
    while (groupTotal > 0) {
        if (groupTotal % 20 > 0) {
            await handleClickGroup(
                groupTotal,
                groupTotal - (groupTotal % 20),
                groupsPrev,
            );
            groupTotal -= groupTotal % 20;
            console.log(groupsPrev);
            await sleep(3000);
        }
        let even = groupTotal / 20;
        if (even > 0) {
            await handleClickGroup(groupTotal, groupTotal - 20, groupsPrev);
            groupTotal -= 20;
            console.log(groupsPrev);
            await sleep(3000);
        }
    }
}

async function handleClickGroup(startGroup, endGroup, groupsPrev) {
    const dialogElm = await handleOpenDialog();

    const dataVisualcompletionElms = await waitForAllChildElm(
        dialogElm,
        DATAVISUAL_SELECTOR,
    );
    for (let i = startGroup - 1; i >= endGroup; i--) {
        const groupElm =
            dataVisualcompletionElms[i].querySelector('div[role="button"]');
        if (groupElm) {
            if (groupsPrev.includes(dataVisualcompletionElms[i].innerText)) {
                console.log(
                    'Duplicate: ',
                    dataVisualcompletionElms[i].innerText,
                );
                continue;
            }
            groupsPrev.push(dataVisualcompletionElms[i].innerText);
            groupElm.scrollIntoView();
            groupElm.click();
            await sleep(100);
        }
    }
    await handlePost(dialogElm);
}

async function handleOpenDialog() {
    const extendBtnElm = document.querySelector('#extendBtn');
    extendBtnElm.click();
    const menuElm = await waitForElm(MENU_SELECTOR);
    const menuItemsElm = await waitForAllChildElm(menuElm, MENU_ITEM_SELECTOR);
    let listInmorePlacesElm;

    [...menuItemsElm].map((menuItemElm) => {
        if (menuItemElm.innerText === LIST_IN_MORE_PLACES)
            listInmorePlacesElm = menuItemElm;
    });
    listInmorePlacesElm.click();
    return waitForElm(`div[aria-label="${LIST_IN_MORE_PLACES}"]`);
}

async function handleGetGroups() {
    const menuElm = await waitForElm(MENU_SELECTOR);
    const menuItemsElm = await waitForAllChildElm(menuElm, MENU_ITEM_SELECTOR);
    let listInmorePlacesElm;

    [...menuItemsElm].map((menuItemElm) => {
        if (menuItemElm.innerText === LIST_IN_MORE_PLACES)
            listInmorePlacesElm = menuItemElm;
    });
    listInmorePlacesElm.click();

    const dialogElm = await waitForElm(
        `div[aria-label="${LIST_IN_MORE_PLACES}"]`,
    );

    let groupsCount = 0;
    const dataVisualcompletionElms = await waitForAllChildElm(
        dialogElm,
        DATAVISUAL_SELECTOR,
    );
    [...dataVisualcompletionElms].forEach((dataVisualcompletionElm) => {
        if (dataVisualcompletionElm.querySelectorAll('i').length > 0) {
            groupsCount += 1;
        }
    });

    await handlecClose(dialogElm);
    return groupsCount;
}

async function handlecClose(dialogElm) {
    const closeBtnElm = await waitForChildElm(
        dialogElm,
        `div[${CLOSEBTN_SELECTOR}]`,
    );
    if (closeBtnElm) closeBtnElm.click();
}

async function handlePost(dialogElm) {
    const postBtnElm = await waitForAllChildElm(
        dialogElm,
        `div[${POSTBTN_SELECTOR}]`,
    );
    postBtnElm[1].click();
}

function waitForElm(selector) {
    return new Promise((resolve) => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver((mutations) => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    });
}

function waitForAllElm(selector) {
    return new Promise((resolve) => {
        if (document.querySelectorAll(selector)) {
            return resolve(document.querySelectorAll(selector));
        }

        const observer = new MutationObserver((mutations) => {
            if (document.querySelectorAll(selector)) {
                resolve(document.querySelectorAll(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    });
}

function waitForChildElm(parentElm, selector) {
    return new Promise((resolve) => {
        if (parentElm.querySelector(selector)) {
            return resolve(parentElm.querySelector(selector));
        }

        const observer = new MutationObserver((mutations) => {
            if (parentElm.querySelector(selector)) {
                resolve(parentElm.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(parentElm.body, {
            childList: true,
            subtree: true,
        });
    });
}

function waitForAllChildElm(parentElm, selector) {
    return new Promise((resolve) => {
        if (parentElm.querySelectorAll(selector)) {
            return resolve(parentElm.querySelectorAll(selector));
        }

        const observer = new MutationObserver((mutations) => {
            if (parentElm.querySelectorAll(selector)) {
                resolve(parentElm.querySelectorAll(selector));
                observer.disconnect();
            }
        });

        observer.observe(parentElm.body, {
            childList: true,
            subtree: true,
        });
    });
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function importCSS() {
    if (document.createStyleSheet) {
        document.createStyleSheet(
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css',
        );
    } else {
        var styles =
            "@import url(' https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css ');";
        var newSS = document.createElement('link');
        newSS.rel = 'stylesheet';
        newSS.href = 'data:text/css,' + escape(styles);
        document.getElementsByTagName('head')[0].appendChild(newSS);
    }
}
