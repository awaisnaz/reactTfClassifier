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
    this.state = {
      results: '',
      cameraLoading: 'Loading ...'
    }  
  }

  componentDidMount() {
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

  async runClassifier() {
    console.log('classifier started...');

    let net = this.state.netModel;

    let classifier = knnClassifier.create();
    // Reads an image from the webcam and associates it with a specific class index.
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
                <h1>Machine learning for image classification</h1>
                <div>
                  (for best experience try in chrome browser)
                </div>
                <div>
                  <video autoPlay playsInline muted width="80%" height="80%" ref={this.webcamElement} ></video>
                </div>
                <div className="btnContainer">
                  <button ref={this.btnA}>Add A</button>
                  <button ref={this.btnB}>Add B</button>
                  <button ref={this.btnC}>Add C</button>
                </div>
                <div ref={this.results} className="results" >
                </div>
                <div className="information" >
                  <ul>
                    <li>
                      Snap a view using the available buttons(in presented order) to recognize and learn
                    </li>
                    <li>
                      For instance, capture the tilting faces in directions for buttons as Add A(left), Add B(center) and Add C(right) mutiple times i.e atleast 3 times or more
                    </li>
                    <li>
                      Try tilting faces from left to right to display predictions accordingly
                    </li>
                  </ul>                    
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

export default App;
