// ==UserScript==
// @name        CoverImg Checker
// @namespace        http://tampermonkey.net/
// @version        1.4
// @description        「記事一覧」の無効なカバー画像を自動チェックする
// @author        Ameba Blog User
// @match        https://ameblo.jp/*/entrylist*
// @match        https://ameblo.jp/*/archive*
// @match        https://ameblo.jp/*/theme*
// @icon        https://www.google.com/s2/favicons?sz=64&domain=ameblo.jp
// @run-at        document-start
// @noframes
// @grant        none
// @updateURL        https://github.com/personwritep/CoverImg_Checker/raw/main/CoverImg_Checker.user.js
// @downloadURL        https://github.com/personwritep/CoverImg_Checker/raw/main/CoverImg_Checker.user.js
// ==/UserScript==



let retry=0;
let interval=setInterval(wait_target, 1);
function wait_target(){
    retry++;
    if(retry>100){ // リトライ制限 100回 0.1secまで
        clearInterval(interval); }
    let target_b=document.body; // 監視 target
    if(target_b){
        clearInterval(interval);
        env();
        main(); }}



function env(){
    let elm=
        '<div id="cic_menu">'+
        '<input id="end_out" type="submit" value="Exit　⏏">'+
        '<input id="cc_help" type="submit" value="?">'+
        '<div class="wrap">'+
        '<input id="wait_time" type="number" min="1" max="9">'+
        '<span id="sec_a">Speed</span>'+
        '<span id="sec_b">sec</span>'+
        '</div>'+
        '<input id="check_option" type="submit" value="No Image All">'+
        '<input id="no_alert" type="submit" value="Display Alert">'+
        '<span class="key">Space：Stop・Go</span>'+
        '<span class="key">　⇨：Next Page</span>'+
        '<span class="key">　⇦：Back Page</span>'+
        '<style>#cic_menu { display: flex; flex-wrap: wrap; font: 16px Meiryo; color: #000; '+
        'position: fixed; top: 40px; left: calc(50% + 355px); width: 140px; padding: 4px; '+
        'border: 1px solid #2196f3; background: #fff; } '+
        '#end_out { margin-bottom: 4px; padding: 4px 0 2px; flex-grow: 1; } '+
        '#cc_help { width: 24px; height: 24px; margin: 5px 2px 0 8px; padding: 1px 6px; '+
        'border-radius: 20px; border: 1px solid #666; } '+
        '.wrap { position: relative; margin-bottom: 2px; width: 100%; '+
        'border: 1px solid #767676; } '+
        '#wait_time { padding: 4px 4px 2px 68px; width: calc(100% - 74px); border: none; } '+
        '#sec_a { position: absolute; top: 4px; left: 12px; } '+
        '#sec_b { position: absolute; top: 4px; right:30px; } '+
        '#check_option, #no_alert { padding: 4px 4px 2px; width: 100%; '+
        'border: 1px solid #767676; background: #fff; } '+
        '#check_option { margin-bottom: 2px; } '+
        '#no_alert { margin-bottom: 10px; } '+
        '.key { padding: 2px 0; text-align: center; }</style>'+
        '</div>'+

        '<style id="cic_style">'+
        // 全体
        'html { overflow-y: scroll; } '+
        '#main { position: absolute; top: 0; left: calc(50% - 505px); width: 840px; padding: 0; '+
        'font-family: Meiryo; background: #b5d3e2; box-shadow: 0 0 0 200vw #d2e0e6; } '+
        '#ambHeader, .skin-bgHeader, .skin-blogHeaderNav, #subA, .skin-blogSubB, '+
        '.skin-blogFooterNav { display: none; } '+
        'div[id^="div-gpt-ad"] { display: none; } '+
        '#app> :not(.skin-page) { display: none; } '+
        '[data-uranus-layout="archive"] { margin: 0; padding:0 !important; } '+
        '[data-uranus-component="archiveNavTab"] { height: 32px; line-height: 32px; } '+
        // リスト全体
        '[data-uranus-layout="archiveBody"] { '+
        'padding: 15px 30px 15px 30px; background: #b5d3e2; } '+
        '[data-uranus-component="monthlyNav"] { padding: 0 0 12px; } '+
        '[data-uranus-component="monthlyNavYear"] { margin-bottom: 6px; } '+
        '[data-uranus-component="themesNav"] { '+
        'padding: 0; margin-bottom: 12px; max-height: 68px; overflow-y: scroll; } '+
        // リスト
        '[data-uranus-component="archiveList"]>li { '+
        'height: 32px; padding: 4px 8px; background: #fff; } '+
        '[data-uranus-component="entryItemFeedback"], '+
        '[data-uranus-component="entryItemTheme"] { display: none; } '+
        '[data-uranus-component="entryItemImage"], '+
        '[data-uranus-component="imageFrame"] img { background: #eee; '+
        'height: 32px !important; display: initial !important; font-size: 0 !important; } '+
        '[data-uranus-component="imageFrame"] img:hover { cursor: default; } '+
        '[data-uranus-component="entryItemTitle"] { overflow: hidden; '+
        'font-size: 16px; color: #000; height: 21px; margin: 0 0 -5px; } '+
        '[data-uranus-component="entryItemTitle"] a:hover { cursor: default; } '+
        '[data-uranus-component="entryItemMeta"] { min-height: unset; height: 20px; } '+
        '[data-uranus-component="entryItemDatetime"] { margin-bottom: -2px; } '+
        // フッター
        '[data-uranus-component="archiveFooter"] { padding: 0; width: 760px; } '+
        '[data-uranus-component="pagination"] { margin: 14px 0 -8px; } '+
        '[data-uranus-component="pagination"] li { font-size: 16px; line-height: 32px; } '+
        '[data-uranus-component="pagination"] li a { height: 30px; } '+
        '</style>';

    if(document.body && !document.querySelector('#cic_menu')){
        document.body.insertAdjacentHTML('beforeend', elm); }

} // elm()



function main(){
    let stop_next=sessionStorage.getItem('cic_stop'); // 自動実行の進行 🔵
    if(!stop_next){
        stop_next=0; }
    sessionStorage.setItem('cic_stop', stop_next); // ストレージ記入



    let wait_sec;
    let wait_time=document.querySelector('#wait_time');
    if(wait_time){
        wait_sec=sessionStorage.getItem('cic_wait')*1000;
        if(!wait_sec){
            wait_sec=4000; }
        wait_time.value=wait_sec/1000;

        wait_time.onchange=function(){
            sessionStorage.setItem('cic_wait', wait_time.value); }} // ストレージ記入



    let option;
    let check_option=document.querySelector('#check_option');
    if(check_option){
        option=sessionStorage.getItem('cic_option'); // 0: No Image All　1: Lost Image Only
        if(option!=1){
            option=0;
            check_option.value='No Image All';
            sessionStorage.setItem('cic_option', 0); }
        else{
            check_option.value='Lost Image Only';
            sessionStorage.setItem('cic_option', 1); }

        check_option.onclick=function(event){
            event.preventDefault();
            if(option==0){
                option=1;
                check_option.value='Lost Image Only';
                sessionStorage.setItem('cic_option', 1); }
            else{
                option=0;
                check_option.value='No Image All';
                sessionStorage.setItem('cic_option', 0); }}}



    let disp_alert;
    let no_alert=document.querySelector('#no_alert');
    if(no_alert){
        disp_alert=sessionStorage.getItem('cic_alert'); // 0: Suppress Alert　1: Display Alert
        if(disp_alert!=0){
            disp_alert=1;
            no_alert.value='Display Alert';
            sessionStorage.setItem('cic_alert', 1); }
        else{
            no_alert.value='Suppress Alert';
            sessionStorage.setItem('cic_alert', 0); }

        no_alert.onclick=function(event){
            event.preventDefault();
            if(disp_alert==0){
                disp_alert=1;
                no_alert.value='Display Alert';
                sessionStorage.setItem('cic_alert', 1); }
            else{
                disp_alert=0;
                no_alert.value='Suppress Alert';
                sessionStorage.setItem('cic_alert', 0); }}}



    document.addEventListener('keydown', function(event){ //「Space」で停止
        if(event.keyCode==32){
            event.preventDefault();
            event.stopImmediatePropagation(); // 必須
            stop_next=sessionStorage.getItem('cic_stop'); // 🔵
            if(stop_next==0){ // 停止
                sessionStorage.setItem('cic_stop', 1); // ストレージ記入
                stop_disp(1); }
            else{ // リロードして続行
                sessionStorage.setItem('cic_stop', 0); // ストレージ記入
                stop_disp(0);
                location.reload(false); }} // ページをリロード
        else if(event.keyCode==39){
            event.preventDefault();
            next_(); }
        else if(event.keyCode==37){
            event.preventDefault();
            pre_(); }
    }, false);



    setTimeout(()=>{
        if(img_check(option)==20){
            next_open();
            main(); }
        else {
            sessionStorage.setItem('cic_stop', 1); // ストレージ記入
            stop_disp(1); }
    }, wait_sec); // カバー画像の読込み待ち時間の調節 🔴



    retuch();
    help();


    let end_out=document.querySelector('#end_out');
    if(end_out){
        end_out.onclick=function(){
            let blog_url=location.href;
            blog_url=blog_url.substring(0, blog_url.indexOf('entrylist'));
            window.location.href=blog_url; }}



    function img_check(option){
        let check=0;
        let stop=0;
        let imgFrame=
            document.querySelectorAll('[data-uranus-component="imageFrame"]');
        for(let k=0; k<imgFrame.length; k++){
            let img=imgFrame[k].querySelector('img');
            if(!img){ // カバー画像枠が無い場合
                if(option==1){ // Lost Image Only の場合は許容
                    check+=1; }
                else{ // No Image All の場合はチェック
                    if(amember(imgFrame[k])){ // アメンバ記事は許容
                        check+=1; }
                    else{
                        stop=1;
                        sessionStorage.setItem('cic_stop', 1); // ストレージ記入
                        stop_disp(1);
                        let li=imgFrame[k].closest('.skin-borderQuiet');
                        li.style.boxShadow='inset 0 0 0 20px #fff000'; }}}
            else{ // カバー画像枠が有る場合
                let img_width=img.width;
                if(img_width==100){ // 正常なカバー画像の場合
                    check+=1; }
                else{ // Lost Image Only の場合はチェック
                    stop=1;
                    sessionStorage.setItem('cic_stop', 1); // ストレージ記入
                    stop_disp(1);
                    let li=imgFrame[k].closest('.skin-borderQuiet');
                    li.style.boxShadow='inset 0 0 0 2px red, inset 0 0 0 20px #fff000'; }}}

        if(stop==1){
            setTimeout(()=>{
                if(disp_alert==1){
                    alert_help(); }}, 200); }

        return check;

    } // img_check()


    function amember(Frame){
        let li=Frame.closest('.skin-borderQuiet')
        if(li.querySelector('[data-uranus-icon~="amember"]')){
            return true; }}


    function alert_help(){
        alert(
            "カバー画像の欠落した記事があります ➔ 次の❶❷の処理をしてください\n"+
            "❶ 赤枠の記事を右クリック ➔ 再編集をして、カバー画像を修正する\n"+
            "❷ カバー画像を修正しない場合\n"+
            "　「⇨」「⇦」で別ページに移動し「Space」でチェック処理を再開する"); }


    function next_open(){
        let next_button=document.querySelector('.js-paginationNext');
        if(next_button && next_button.classList.contains('is-disabled')!=true){
            stop_next=sessionStorage.getItem('cic_stop'); // 自動実行の進行 🔵
            if(stop_next==0){
                next_button.click(); }}} //「⇨」を押す（部分読込み）


    function next_(){
        let next_button=document.querySelector('.js-paginationNext');
        if(next_button && next_button.classList.contains('is-disabled')!=true){
            next_button.click(); }} //「⇨」を押す（部分読込み）


    function pre_(){
        let pre_button=document.querySelector('.js-paginationPrev');
        if(pre_button && pre_button.classList.contains('is-disabled')!=true){
            pre_button.click(); }} //「⇦」を押す（部分読込み）


    function stop_disp(n){
        let base=
            document.querySelector('[data-uranus-layout="archiveBody"]');
        if(base){
            if(n==0){
                base.style.background=''; }
            else{
                base.style.background='#2196f3'; }}}



    function retuch(){
        let ac_list=document.querySelectorAll('.skin-borderQuiet');
        for(let k=0; k<ac_list.length; k++){
            ac_list[k].setAttribute("onclick", 'return false;'); // 左クリック抑止
            ac_list[k].setAttribute("oncontextmenu", 'return false;'); // 右クリック抑止
            ac_list[k].addEventListener('contextmenu', function(e){ // 右クリック専用メニュー表示
                menu_disp(e, ac_list[k]); }); }

        function menu_disp(event, target){
            target.style.position='relative';

            let retuch_menu=
                '<div id="eaoa_menu">'+
                '<span id="retoucha">再編集</span> '+
                '<style>#eaoa_menu { position: absolute; z-index: 20; top: 3px; right: 120px;'+
                'font: normal 16px Meiryo; color: #333; padding: 4px 10px 2px; '+
                'border: 2px solid #2196f3; background: #fff; cursor: pointer; } '+
                '#eaoa_menu span { padding: 1px 4px 0; } '+
                '#eaoa_menu:hover { color: #fff; background: #2196f3; }</style>'+
                '</div>';

            if(document.querySelector('#eaoa_menu')){
                document.querySelector('#eaoa_menu').remove(); }
            target.insertAdjacentHTML('beforeend', retuch_menu);

            retouch_item(target); }


        document.addEventListener('click', function(){
            document.getElementById('eaoa_menu').style.display="none"; // 専用メニュー抑止
            let ac_list=document.querySelectorAll('.skin-borderQuiet');
            for(let k=0; k<ac_list.length; k++){
                ac_list[k].setAttribute("onContextmenu", 'return false;'); }}); // コンテキスト抑止

        function retouch_item(target){
            let retouch=document.getElementById('retoucha');
            retouch.onclick=function(){
                let title_link=target.querySelector('h2 a');
                let entry_id_a=title_link.getAttribute('href').split('entry-');
                if(entry_id_a[1]){
                    let entry_id=entry_id_a[1].slice(0, 11);
                    if(entry_id){
                        let path=
                            'https://blog.ameba.jp/ucs/entry/srventryupdateinput.do?id='+entry_id;
                        window.open(path, "_blank"); }}}}

    } // retuch()



    function help(){
        let cc_help=document.querySelector('#cc_help');
        if(cc_help){
            cc_help.onclick=function(){
                let url='https://ameblo.jp/personwritep/entry-12770331516.html';
                window.open(url, '_blank'); }}}


} // main()

