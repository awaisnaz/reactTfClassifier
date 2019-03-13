import React, { Component } from 'react';
import * as knnClassifier from "@tensorflow-models/knn-classifier";
import * as mobilenet from "@tensorflow-models/mobilenet";
import * as tf from "@tensorflow/tfjs";
import './MLApp.css';

class MLApp extends Component {

  constructor() {
    super();
    this.webcamElement = React.createRef();  
    this.results = React.createRef();
    this.classifier = knnClassifier.create();
    this.state = {
      netModel: null,
      classes: ['A','B','C'],
      cameraLoading: 'Loading ...'
    }  
  }

  componentDidMount() {
    document.title = "ML classifer app"
    Promise.all([this.loadModel(),this.setupWebcam()]).then(_ => this.runClassifier());
  }

  async loadModel() {
    return new Promise(async (resolve, reject) => {
      console.log('Loading mobilenet..');
      try {
        // Load the model.
        let net = await mobilenet.load();
        await this.setState({ netModel: net }); 
        console.log('Sucessfully loaded model');
        return resolve();        
      } catch (error) {
        console.log('model mobilenet could not be loaded..');
        return reject()
      }
    });
  }
 
  async setupWebcam() {
    console.log('Loading cam setup..');
    return new Promise((resolve, reject) => {
      const navigatorAny = navigator;
      navigator.getUserMedia = navigator.getUserMedia ||
          navigatorAny.webkitGetUserMedia || navigatorAny.mozGetUserMedia ||
          navigatorAny.msGetUserMedia;
        if (navigator.getUserMedia) {
        navigator.permissions.query({name:'camera'}).then(result => {
          if(result.state !== 'granted') {
            this.setState({ 
              cameraLoading: 'Kindly grant access to the camera' 
            })     
          }
        })  
        navigator.getUserMedia({video: true},
          stream => {
            this.setState({ 
              cameraLoading: '' 
            }, () => {
              //Object.assign(this.webcamElement.current, {srcObject:stream}, {'onloadeddata':() => resolve()})
              this.webcamElement.current.srcObject = stream;
              this.webcamElement.current.addEventListener('loadeddata',  () => resolve(), false);
              console.log('cam setup complete!!');
              return resolve();
            });               
          },
          error => { 
            this.setState({ 
                cameraLoading: 'Kindly grant access to the camera' 
              }
              , () => reject()
            );               
          }
        );
      } else {
          this.setState({ 
            cameraLoading: 'Camera not available' 
          }
          , () => reject()
        );               
      }
    });
  }

  // Reads an image from the webcam and associates it with a specific class index.
  async addExample(classId) {
    const net = this.state.netModel;
    if(net !== null && ((this.classifier.getNumClasses() > 0 && classId > 0) || (this.classifier.getNumClasses() >= 0 && classId === 0))) {
      // Get the intermediate activation of MobileNet 'conv_preds' and pass that
      // to the KNN classifier.
      const activation = net.infer(this.webcamElement.current, 'conv_preds');

      // Pass the intermediate activation to the classifier.
      this.classifier.addExample(activation, classId);
    }
  };
  

  async runClassifier() {
    console.log('classifier started...');

    let net = this.state.netModel;

    while (true) {
      if (this.classifier.getNumClasses() > 0) {

        // Get the activation from mobilenet from the webcam.
        const activation = net.infer(this.webcamElement.current, 'conv_preds');
        // Get the most likely class and confidences from the classifier module.
        const result = await this.classifier.predictClass(activation);

        const classes = this.state.classes;
        const output = { prediction: classes[result.classIndex], probability: result.confidences[result.classIndex] };
        this.results.current.innerHTML = `<ul><li>Prediction&nbsp;&nbsp;: ${output.prediction} </li><li>Probability&nbsp;: ${output.probability} </li></ul>`
      }

      await tf.nextFrame();
    }
  }

  render() {
    return (
      <div className="App" >
        <div className="mainContainer">
          {this.state.cameraLoading === '' 
          ? 
            (
              <div className="workingContainer">
                <h2>Machine learning for image classification</h2>
                <div>
                  <video autoPlay playsInline muted width="80%" height="80%" ref={this.webcamElement} ></video>
                </div>
                <div>
                  (for best experience try in chrome browser)
                </div>
                <div className="btnContainer">
                  {
                    this.state.classes.map((item,idx) => <button key={`btn${item+idx}`} ref={input => this[`btn${item}`] = input} onClick={_ => this.addExample(idx)} >Add {item}</button>)
                  }
                </div>
                <div ref={this.results} className="results" >
                </div>
                <div className="information" >
                  <ul>
                  {
                    [
                      "Snap a view using the available buttons(in presented order) to recognize and learn"
                      ,"For instance, capture the tilting faces in directions for buttons as Add A(left), Add B(center) and Add C(right) mutiple times i.e. atleast 3 times or more is recommended (prediction is certainly more accurate the more image snapshots are learned)"
                      ,"Try tilting faces from left to right to display predictions accordingly"
                      ,"All of the image data from camera stream is processed and recognized to learn locally and is not stored or accessed on any remote server"
                    ].map((item, idx) => <li key={idx} >{item}</li>)
                  }
                  </ul>                    
                </div>
                <div className="footer">
                  Project available on github <a href="https://github.com/NileshSP/reactTfClassifier" >@NileshSP/reactTfClassifier</a> 
                </div>
              </div>
            )
          : 
            (
              <div className="loadingContainer" >{this.state.cameraLoading}</div>
            )
          }
        </div>
      </div>
    );
  }
}

export default MLApp;
