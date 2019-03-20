import React, { Component } from 'react';
import * as knnClassifier from "@tensorflow-models/knn-classifier";
import * as mobilenet from "@tensorflow-models/mobilenet";
import * as tf from "@tensorflow/tfjs";
import './Mlapp.css';

const Videocontrol = React.lazy(() => import("./Videocontrol"))

class Mlapp extends Component {

  constructor(props) {
    super(props);
    this.results = React.createRef();
    this.loadingSmiley = React.createRef();
    this.classifier = knnClassifier.create();
    this.loadingInterval = null;
    this.state = {
      netModel: null,
      classes: ['A','B','C', 'Reset'],
      classCount: 0,
      modelLoading: 'Loading ...'
    }  
  }

  componentDidMount() {
    document.title = "ML Classifier App"
    this.loadingInterval = setInterval(this.smile, 4000)  
    this.loadSmiley()
    this.loadMLModel().then(_ => { 
      this.loadingSmiley.current.style = '';
      this.loadingSmiley.current.innerHTML = ''
      this.loadingInterval = null; 
      this.updateState({ modelLoading : '' });
      this.runClassifier();
    });
  }

  componentWillUnmount() {
    this.classifier = null;
  }

  loadSmiley() {
    if(this.loadingSmiley !== undefined) {
      let a = this.loadingSmiley.current;
      a.style = 'position: absolute; top:25%; left:48%; font-size:40pt; color:limegreen';
      a.innerHTML = "&#xf11a;";
      setTimeout(function () {
          a.innerHTML = "&#xf118;";
        }, 1000);
      setTimeout(function () {
          a.innerHTML = "&#xf11a;";
        }, 2000);
      setTimeout(function () {
          a.innerHTML = "&#xf118;";
        }, 3000);
    }
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
      await this.classifier.addExample(activation, classId);
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
        this.results.current.innerHTML = 
              (output.prediction !== undefined) 
                  ? `<ul><li>Prediction&nbsp;&nbsp;: ${output.prediction} </li><li>Probability&nbsp;: ${output.probability + '%'} </li></ul>`
                  : ``
      }

      await tf.nextFrame();
    }
  }

  headerComponent() {
    return (
      <h2>Machine learning for video classification</h2>
    )
  }

  videoComponent() {
    return (
      <React.Suspense fallback={<div className="loadingContainer" >Loading...</div>} >
        <Videocontrol 
          parentState={this.state} 
          parentStateUpdate={options => this.updateState(options)} 
          ref={item => this.videoElement = item} 
        />
      </React.Suspense>
    )
  }

  buttonListComponent() {
    return (
      <div className="btnContainer">
      {
        this.state.classes
        .map((item,idx) => 
            <button 
              key={`btn${item+idx}`} ref={input => this[`btn${item}`] = input} 
              onClick={_ => { 
                if(item.toLowerCase() !== 'reset') {
                  this.addExample(idx) 
                }
                else {
                  //window.location.reload();
                  this.classifier.clearAllClasses();
                  this.updateState({ classCount: 0 });
                  this.results.current.innerHTML = ''
                }
              }} 
              disabled={
                ((item.toLowerCase() === 'reset' && this.state.classCount > 0) 
                  ? false
                  : !( idx <= this.state.classCount ))}
            >
              {(item.toLowerCase() !== 'reset' ? "Add " : "") + item}
            </button>
          )
      }
      </div>  
    )
  }

  resultsComponent() {
    return <div ref={this.results} className="results" >
    </div>
  }

  instructionListComponent() {
    return (
      <div className="instructions" >
        <h4>(Instructions)</h4>
        <ul>
        {
          [
            "Snap multiple views using the available buttons(in presented order as A -> B -> C) to recognize and learn, for each button hit - it would start displaying prediction with probability subsequently"
            ,"For instance, capture the tilting faces in directions for buttons as Add A(left), Add B(center) and Add C(right) mutiple times i.e. atleast 3 times each or more is recommended (prediction is certainly more accurate the more image snapshots are learned)"
            ,"Try tilting faces from left to right freely to show expected predictions or refine it further by continuing with the respective buttons as desired"
            ,"All of the data from camera stream is processed and recognized to learn locally and is not stored or accessed on any remote server"
          ].map((item, idx) => <li key={idx} >{item}</li>)
        }
        </ul>
      </div>
    )                    
  }

  footerComponent() {
    return (
    <div className="footer">
      Project available on github <a href="https://github.com/NileshSP/reactTfClassifier" target="_blank" rel="noopener noreferrer" >@NileshSP/reactTfClassifier</a> 
    </div>
    )
  }

  render() {
    return (
      <div className="App" >
        <div className="mainContainer">
          {this.state.modelLoading === '' 
          ? 
            (
              <div className="workingContainer">
                { this.headerComponent() }
                { this.videoComponent() }
                { this.buttonListComponent() }
                { this.resultsComponent() }
                { this.instructionListComponent() }
                { this.footerComponent() }
              </div>
            )
          : 
            (
              <div className="fa" ref={this.loadingSmiley} ></div>
            )
          }
        </div>
      </div>
    );
  }
}

export default Mlapp;
