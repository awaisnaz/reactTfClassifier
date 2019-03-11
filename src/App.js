import React, { Component } from 'react';
import * as knnClassifier from "@tensorflow-models/knn-classifier";
import * as mobilenet from "@tensorflow-models/mobilenet";
import * as tf from "@tensorflow/tfjs";
import './App.css';

class App extends Component {

  constructor() {
    super();
    this.webcamElement = React.createRef();  
    this.btnA = React.createRef();  
    this.btnB = React.createRef();  
    this.btnC = React.createRef();
    this.results = React.createRef();  
  }

  componentDidMount() {
    this.app();
  }
 
  async setupWebcam() {
    return new Promise((resolve, reject) => {
      const navigatorAny = navigator;
      navigator.getUserMedia = navigator.getUserMedia ||
          navigatorAny.webkitGetUserMedia || navigatorAny.mozGetUserMedia ||
          navigatorAny.msGetUserMedia;
      if (navigator.getUserMedia) {
        navigator.getUserMedia({video: true},
          stream => {
            //Object.assign(this.webcamElement.current, {srcObject:stream}, {'onloadeddata':() => resolve()})
             this.webcamElement.current.srcObject = stream;
             this.webcamElement.current.addEventListener('loadeddata',  () => resolve(), false);
            return resolve();
          },
          error => reject());
      } else {
        reject();
      }
    });
  }

  async app() {
    console.log('Loading mobilenet..');

    // Load the model.
    let net = await mobilenet.load();
    console.log('Sucessfully loaded model');

    await this.setupWebcam();

    let classifier = knnClassifier.create();
    // Reads an image from the webcam and associates it with a specific class
    // index.
    const addExample = classId => {
      // Get the intermediate activation of MobileNet 'conv_preds' and pass that
      // to the KNN classifier.
      const activation = net.infer(this.webcamElement.current, 'conv_preds');

      // Pass the intermediate activation to the classifier.
      classifier.addExample(activation, classId);
    };

    // When clicking a button, add an example for that class.
    this.btnA.current.addEventListener('click', () => addExample(0));
    this.btnB.current.addEventListener('click', () => addExample(1));
    this.btnC.current.addEventListener('click', () => addExample(2));

    while (true) {
      if (classifier.getNumClasses() > 0) {
        // Get the activation from mobilenet from the webcam.
        const activation = net.infer(this.webcamElement.current, 'conv_preds');
        // Get the most likely class and confidences from the classifier module.
        const result = await classifier.predictClass(activation);

        const classes = ['A', 'B', 'C'];
        const output = { prediction: classes[result.classIndex], probability: result.confidences[result.classIndex] };
        //console.log(output);
        this.results.current.innerText = `
          prediction: ${output.prediction}\n
          probability: ${output.probability}
        `;
      }

      await tf.nextFrame();
    }
  }

  render() {
    return (
      <div className="App" >
        <div className="mainContainer">
          <div>
            <video autoPlay playsInline muted width="80%" height="80%" ref={this.webcamElement} ></video>
          </div>
          <div className="btnContainer">
            <button ref={this.btnA}>Add A</button>
            <button ref={this.btnB}>Add B</button>
            <button ref={this.btnC}>Add C</button>
          </div>
          <div ref={this.results} ></div>
        </div>
      </div>
    );
  }
}

export default App;
