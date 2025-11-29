// upload.js: Upload page - file input, drag-drop, progress

let uploadedFiles = { front: null, back: null, side: null, video: null };

function initializeUploadPage() {
    const uploadOptions = document.getElementById('uploadOptions');
    const photoUploadSection = document.getElementById('photoUploadSection');
    const videoUploadSection = document.getElementById('videoUploadSection');
    const photoOption = document.getElementById('photoOption');
    const videoOption = document.getElementById('videoOption');
    const backToOptions = document.getElementById('backToOptions');
    const backToOptionsVideo = document.getElementById('backToOptionsVideo');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const recommendationsSection = document.getElementById('recommendationsSection');
    const continueBtn = document.getElementById('continueBtn');

    if(photoOption) photoOption.addEventListener('click', ()=>{
        uploadOptions.style.display='none'; photoUploadSection.style.display='block';
    });
    if(videoOption) videoOption.addEventListener('click', ()=>{
        uploadOptions.style.display='none'; videoUploadSection.style.display='block';
    });
    if(backToOptions) backToOptions.addEventListener('click', ()=>{
        photoUploadSection.style.display='none'; uploadOptions.style.display='block';
    });
    if(backToOptionsVideo) backToOptionsVideo.addEventListener('click', ()=>{
        videoUploadSection.style.display='none'; uploadOptions.style.display='block';
    });

    // Individual photo uploads
    ['front','back','side'].forEach(type=>{
        const input=document.getElementById(`${type}Input`);
        const zone=document.getElementById(`${type}Zone`);
        if(input && zone){ input.addEventListener('change',(e)=>{
            const file=e.target.files[0]; if(file){ handlePhotoUpload(type, file, zone);}
        });
        zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('dragover');});
        zone.addEventListener('dragleave',e=>{e.preventDefault();zone.classList.remove('dragover');});
        zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('dragover'); const file=e.dataTransfer.files[0]; if(file && file.type.startsWith('image/')){handlePhotoUpload(type,file,zone);}});
        }
    });

    // Video upload
    const videoInput=document.getElementById('videoInput'); const videoZone=document.getElementById('videoZone');
    if(videoInput && videoZone){
        videoInput.addEventListener('change', e=>{ const file=e.target.files[0]; if(file){handleVideoUpload(file);} });
        videoZone.addEventListener('dragover',e=>{e.preventDefault();videoZone.classList.add('dragover');});
        videoZone.addEventListener('dragleave',e=>{e.preventDefault();videoZone.classList.remove('dragover');});
        videoZone.addEventListener('drop',e=>{e.preventDefault();videoZone.classList.remove('dragover');const file=e.dataTransfer.files[0];if(file && file.type.startsWith('video/')){handleVideoUpload(file);}});
    }

    if(continueBtn) continueBtn.addEventListener('click',function(){
        if(this.classList.contains('enabled')){
            this.innerHTML='<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
            setTimeout(()=>{showPage('virtual-tryon');},2000);
        }
    });

    function handlePhotoUpload(type, file, zone){
        progressContainer.style.display='block';
        simulateUpload(()=>{
            uploadedFiles[type]=file;
            zone.classList.add('uploaded');
            const icon=zone.querySelector('.upload-icon i');
            const text=zone.querySelector('.upload-text');
            const subtitle=zone.querySelector('.upload-subtitle');
            icon.className='fas fa-check-circle'; text.textContent='Photo Uploaded'; subtitle.textContent='Click to change';
            checkAllUploads();
        });
    }
    function handleVideoUpload(file){
        progressContainer.style.display='block';
        simulateUpload(()=>{
            uploadedFiles.video=file;
            const videoZone=document.getElementById('videoZone');
            videoZone.classList.add('uploaded');
            const icon=videoZone.querySelector('.upload-icon i');
            const text=videoZone.querySelector('.upload-text');
            const subtitle=videoZone.querySelector('.upload-subtitle');
            icon.className='fas fa-check-circle'; text.textContent='Video Uploaded Successfully'; subtitle.textContent='Click to change video';
            showRecommendations(); enableContinueButton();
        });
    }
    function simulateUpload(callback){
        let progress=0, interval=setInterval(()=>{
            progress+=Math.random()*15;
            if(progress>=100){ progress=100; clearInterval(interval); setTimeout(()=>{
                progressContainer.style.display='none'; callback();
            },500);}
            progressBar.style.width=progress+'%'; progressText.textContent=Math.round(progress)+'%';
        },200);
    }
    function checkAllUploads(){
        const photoCount=['front','back','side'].filter(type=>uploadedFiles[type]).length;
        if(photoCount>=2){ showRecommendations(); enableContinueButton();}
    }
    function showRecommendations(){
        setTimeout(()=>{ recommendationsSection.style.display='block';
            recommendationsSection.scrollIntoView({behavior:'smooth', block:'nearest'}); },300);
    }
    function enableContinueButton(){ continueBtn.classList.add('enabled'); continueBtn.disabled=false; }

    document.querySelectorAll('.size-card').forEach(card=>{
        card.addEventListener('click',function(){
            document.querySelectorAll('.size-card').forEach(c=>c.classList.remove('selected')); this.classList.add('selected');
        });
    });
}
document.addEventListener('DOMContentLoaded',initializeUploadPage);
