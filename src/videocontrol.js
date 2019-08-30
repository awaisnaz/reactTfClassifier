import React, { Component } from 'react';

class Videocontrol extends Component {

  constructor(props) {
    super(props);
    this.audioSource = React.createRef();
    this.audioOutput = React.createRef();
    this.videoSource = React.createRef();
    this.videoElement = null;
    this.state = {
      cameraLoading: '',
    }
  }

  componentDidMount() {
    this.setupMediaWithOptions(this);
  }

  async setupMediaWithOptions(instance) {
    const videoElement = this.videoElement;
    const audioInputSelect = this.audioSource.current;
    const audioOutputSelect = this.audioOutput.current;
    const videoSelect = this.videoSource.current;
    const selectors = [audioInputSelect, audioOutputSelect, videoSelect];

    const audioSource = audioInputSelect.value;
    const videoSource = videoSelect.value;
    const constraints = {
      audio: {deviceId: audioSource ? {exact: audioSource} : undefined},
      video: {deviceId: videoSource ? {exact: videoSource} : undefined}
    };
  
    audioOutputSelect.disabled = !('sinkId' in HTMLMediaElement.prototype);
    
    function gotDevices(deviceInfos) {
      // Handles being called several times to update labels. Preserve values.
      const values = selectors.map(select => select.value);
      selectors.forEach(select => {
        while (select.firstChild) {
          select.removeChild(select.firstChild);
        }
      });
      for (let i = 0; i !== deviceInfos.length; ++i) {
        const deviceInfo = deviceInfos[i];
        const option = document.createElement('option');
        option.value = deviceInfo.deviceId;
        if (deviceInfo.kind === 'audioinput') {
          option.text = deviceInfo.label || `microphone ${audioInputSelect.length + 1}`;
          audioInputSelect.appendChild(option);
        } else if (deviceInfo.kind === 'audiooutput') {
          option.text = deviceInfo.label || `speaker ${audioOutputSelect.length + 1}`;
          audioOutputSelect.appendChild(option);
        } else if (deviceInfo.kind === 'videoinput') {
          option.text = deviceInfo.label || `camera ${videoSelect.length + 1}`;
          videoSelect.appendChild(option);
        } else {
          console.log('Some other kind of source/device: ', deviceInfo);
        }
      }
      selectors.forEach((select, selectorIndex) => {
        if (Array.prototype.slice.call(select.childNodes).some(n => n.value === values[selectorIndex])) {
          select.value = values[selectorIndex];
        }
      });
    }
    
    navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleError);
    
    // Attach audio output device to video element using device/sink ID.
    function attachSinkId(element, sinkId) {
      if (typeof element.sinkId !== 'undefined') {
        element.setSinkId(sinkId)
          .then(() => {
            console.log(`Success, audio output device attached: ${sinkId}`);
          })
          .catch(error => {
            let errorMessage = error;
            if (error.name === 'SecurityError') {
              errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`;
            }
            console.error(errorMessage);
            // Jump back to first output device in the list as it's the default.
            audioOutputSelect.selectedIndex = 0;
          });
      } else {
        console.warn('Browser does not support output device selection.');
      }
    }
    
    function changeAudioDestination() {
      const audioDestination = audioOutputSelect.value;
      attachSinkId(videoElement, audioDestination);
    }
    
    async function gotStream(stream) {
      window.stream = stream; // make stream available to console
      videoElement.style.visibility = 'visible';
      videoElement.srcObject = stream;
      await instance.props.parentStateUpdate({ mediaControlReady: true })
      // Refresh button list in case labels have become available
      return navigator.mediaDevices.enumerateDevices();
    }
    
    function handleError(error) {
      if(error.message === 'Permission denied') {
        navigator.permissions.query({name:'camera'}).then(result => {
          if(result.state !== 'granted') {
            //console.log(this.props)
            instance.setState({ cameraLoading: 'Kindly grant access to the camera' });
            navigator.mediaDevices.getUserMedia(constraints).then(gotStream).then(gotDevices).catch(handleError);
          }
        }) 
      }   
      console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
    }
    
    function start() {
      if (window.stream) {
        window.stream.getTracks().forEach(track => {
          track.stop();
        });
      }
      navigator.mediaDevices.getUserMedia(constraints).then(gotStream).then(gotDevices).catch(handleError);
    }
    
    audioInputSelect.onchange = start;
    audioOutputSelect.onchange = changeAudioDestination;
    
    videoSelect.onchange = start;
    
    start();
  }

  render() {
    return (
      <div >
        { this.state.cameraLoading === "" 
        ?
          (
            <div className="videoContainer">
              <div className="optionsContainer">
                <div className="select" hidden>
                  <label htmlFor="audioSource">Audio input source: </label><select id="audioSource" ref={this.audioSource}></select>
                </div>
                <div className="select" hidden>
                  <label htmlFor="audioOutput">Audio output destination: </label><select id="audioOutput" ref={this.audioOutput} ></select>
                </div>
                <div className="select">
                  <label htmlFor="videoSource">Video source: </label><select id="videoSource" ref={this.videoSource} ></select>
                </div>
              </div>
              <div>
                  <video autoPlay playsInline muted width={this.props.parentState.videoSize.width} height={this.props.parentState.videoSize.height} ref={item => this.videoElement = item} required ></video>
              </div>
              <div>
                (for best experience try in chrome browser)
              </div>
            </div>
          )     
        :
          (
            <div className="loadingMessage" >{this.state.cameraLoading}</div>
          )
        }
      </div>
    )
  }
}

export default Videocontrol;