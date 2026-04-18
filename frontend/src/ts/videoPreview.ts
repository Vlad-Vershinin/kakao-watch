export default function videoPreview(title : string, previewImageUrl : string, authorId : number){

    return(`
        <article class="flex flex-col min-w-60 min-h-30 gap-3 bg-bg-primary p-4 rounded-[8px] border border-text-tertiary">
            <a href="${previewImageUrl}">
                <img src="" alt="Preview image" class="object-center object-fill min-w-60 min-h-30 bg-gray-400">
            </a>
            
            <div class="flex w-full justify-between">
                <h2 class="font-black text-[18px] overflow-hidden">${title}</h2>
                <button class="self-end rotate-90 text-[20px] bg-bg-tertiary p-1 rounded-full hover:bg-bg-hover active:bg-bg-primary transition-colors" id="moreOptions">...</button>
            </div>
            <div class="flex">
                <a href="" class="flex gap-3">
                    <div class="bg-gray-400 w-10 h-10">
                        <img src="" alt="">
                    </div>
                    <p class=" text-[18px] self-center">
                        Название канала
                    </p>
                </a>
            </div>
        </article>
        `);
}