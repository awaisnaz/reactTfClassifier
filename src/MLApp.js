import React, { Component } from 'react';
import * as knnClassifier from "@tensorflow-models/knn-classifier";
import * as mobilenet from "@tensorflow-models/mobilenet";
import * as tf from "@tensorflow/tfjs";
import './Mlapp.css';

const Videocontrol = React.lazy(() => import("./Videocontrol"))

class Mlapp extends Component {

  constructor() {
    super();
    this.results = React.createRef();
    this.classifier = knnClassifier.create();
    this.state = {
      netModel: null,
      classes: ['A','B','C'],
      classCount: 0,
      cameraLoading: 'Loading ...'
    }  
  }

  componentDidMount() {
    document.title = "ML Classifier App"
    this.loadMLModel().then(_ => { 
      this.updateState({ cameraLoading : '' }); this.runClassifier() 
    });
  }

  updateState = async (options) => await this.setState({...this.state, ...options}) 

  async loadMLModel() {
    return new Promise(async (resolve, reject) => {
      console.log('Loading mobilenet..');
      try {
        // Load the model.
        let net = await mobilenet.load();
        await this.updateState({ netModel: net }); 
        console.log('Sucessfully loaded model');
        return resolve();        
      } catch (error) {
        console.log('model mobilenet could not be loaded..');
        return reject()
      }
    });
  }
 

  // Reads an image from the webcam and associates it with a specific class index.
  async addExample(classId) {
    const net = this.state.netModel;
    if(net !== null && ((this.classifier.getNumClasses() > 0 && classId > 0) || (this.classifier.getNumClasses() >= 0 && classId === 0))) {
      // Get the intermediate activation of MobileNet 'conv_preds' and pass that
      // to the KNN classifier.
      const activation = net.infer(this.videoElement.videoElement, 'conv_preds');

      // Pass the intermediate activation to the classifier.
      this.classifier.addExample(activation, classId);
    }
    this.updateState({ classCount: (classId + 1 > this.state.classCount ? classId + 1 : this.state.classCount) })
  };
  

  async runClassifier() {
    console.log('classifier started...');

    let net = this.state.netModel;

    while (true) {
      if (this.classifier.getNumClasses() > 0) {

        // Get the activation from mobilenet from the webcam.
        const activation = net.infer(this.videoElement.videoElement, 'conv_preds');
        // Get the most likely class and confidences from the classifier module.
        const result = await this.classifier.predictClass(activation);

        const classes = this.state.classes;
        const output = { prediction: classes[result.classIndex]
          , probability: (result.confidences[result.classIndex] !== null && result.confidences[result.classIndex] !== undefined ? result.confidences[result.classIndex] * 100 : 0) 
        };
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
                <React.Suspense fallback={<div className="loadingContainer" >Loading...</div>} >
                  <Videocontrol parentState={this.state} 
                      parentStateUpdate={options => this.updateState(options)} 
                      ref={item => this.videoElement = item} 
                      />
                </React.Suspense>
                <div className="btnContainer">
                  {
                    this.state.classes
                          .map((item,idx) => <button 
                                                key={`btn${item+idx}`} ref={input => this[`btn${item}`] = input} 
                                                onClick={_ => this.addExample(idx)} 
                                                disabled={!( this.state.classCount >= idx )}
                                              >
                                                Add {item}
                                              </button>
                              )
                  }
                </div>
                <div ref={this.results} className="results" >
                </div>
                <div className="information" >
                  <ul>
                  {
                    [
                      "Snap a view using the available buttons(in presented order as A -> B -> C) to recognize and learn"
                      ,"For instance, capture the tilting faces in directions for buttons as Add A(left), Add B(center) and Add C(right) mutiple times i.e. atleast 3 times each or more is recommended (prediction is certainly more accurate the more image snapshots are learned)"
                      ,"Try tilting faces from left to right to display predictions accordingly"
                      ,"All of the image data from camera stream is processed and recognized to learn locally and is not stored or accessed on any remote server"
                    ].map((item, idx) => <li key={idx} >{item}</li>)
                  }
                  </ul>                    
                </div>
                <div className="footer">
                  Project available on github <a href="https://github.com/NileshSP/reactTfClassifier" target="_blank" rel="noopener noreferrer" >@NileshSP/reactTfClassifier</a> 
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

export default Mlapp;
