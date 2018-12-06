import React from 'react'
import { StyleSheet, Animated, Easing } from 'react-native'
import memoize from 'fast-memoize'
import { Svg } from 'expo'

const AnimatedSvgPath = Animated.createAnimatedComponent(Svg.Path)

class Loop extends React.Component {
  constructor(props) {
    super(props)

    const {
      width,
      borderWidth,
    } = props

    this._headProgression = new Animated.Value(2)
    this._tailProgression = new Animated.Value(1)

    const interpolations ={
      in: {
        inputRange:  [0,                      1],
        outputRange: [-width/2 - borderWidth, 1/2],
        extrapolate: 'clamp',
      },
      loopIn: {
        inputRange:  [1,       2],
        outputRange: [Math.PI, Math.PI * 2],
        extrapolate: 'clamp',
      },
      loopOut: {
        inputRange:  [2, 3],
        outputRange: [0, Math.PI],
        extrapolate: 'clamp',
      },
      out: {
        inputRange:  [3, 4],
        outputRange: [0, 3/6 + width/2 ],
        extrapolate: 'clamp',
      },
    }

    this.headIn = this._headProgression.interpolate(interpolations.in)
    this.headLoopIn = this._headProgression.interpolate(interpolations.loopIn)
    this.headLoopOut = this._headProgression.interpolate(interpolations.loopOut)
    this.headOut = this._headProgression.interpolate(interpolations.out)

    this.tailIn = this._tailProgression.interpolate(interpolations.in)
    this.tailLoopIn = this._tailProgression.interpolate(interpolations.loopIn)
    this.tailLoopOut = this._tailProgression.interpolate(interpolations.loopOut)
    this.tailOut = this._tailProgression.interpolate(interpolations.out)

    this._headProgression.addListener(this._setPaths)
    this._tailProgression.addListener(this._setPaths)
  }
  
  _startAnimation = () => {
    const {
      durations: {
        in: durationIn,
        loopIn: durationLoopIn,
        loopOut: durationLoopOut,
        out: durationOut,
      },
      easings: {
        in: easingIn,
        loopIn: easingLoopIn,
        loopOut: easingLoopOut,
        out: easingOut,
      },
    } = this.props

    // // head
    
    // Animated.sequence([
    //   Animated.timing(
    //     this._headProgression,
    //     {
    //       toValue: 1,
    //       duration: durationIn,
    //       useNativeDriver: true,
    //       easing: easingIn,
    //     },
    //   ),
    //   Animated.timing(
    //     this._headProgression,
    //     {
    //       toValue: 2,
    //       duration: durationLoopIn,
    //       useNativeDriver: true,
    //       easing: easingLoopIn,
    //     },
    //   ),
    //   Animated.timing(
    //     this._headProgression,
    //     {
    //       toValue: 3,
    //       duration: durationLoopOut,
    //       useNativeDriver: true,
    //       easing: easingLoopOut,
    //     },
    //   ),
    //   Animated.timing(
    //     this._headProgression,
    //     {
    //       toValue: 4,
    //       duration: durationOut,
    //       useNativeDriver: true,
    //       easing: easingOut,
    //     },
    //   )
    // ]).start(() => {
    //   Animated.timing(
    //     this._headProgression,
    //     {
    //       toValue: 0,
    //       duration: 1000,
    //       useNativeDriver: true,
    //       easing: Easing.inOut(Easing.linear),
    //     },
    //   )
    //   .start(this._startAnimation)
    // })

    // tail
    Animated.timing(
      this._tailProgression,
      {
        toValue: 4,
        duration: 4000,
        useNativeDriver: true,
      },
    ).start()
  }

  componentDidMount() {
    this._setPaths()

    // this._startAnimation()
  }

  componentWillMount() {
    this._headProgression.removeListener(this._setPaths);
    this._tailProgression.removeListener(this._setPaths);
  }

  render() {
    const {
      fillColor,
      borderColor,
      borderWidth,
      trailColor,
      counting
    } = this.props

    const d = 'M 0 0'
    
    return (
      <Svg
        style={styles.loop}
        viewBox={`0 0 1 1`}
      >
        {trailColor && (
          <React.Fragment>
            <Svg.Path
              d={this._getLoopInPath(3/6, Math.PI * 2)}
              fill={trailColor}
            />
            <Svg.Path
              d={this._getLoopOutPath(Math.PI, 3/6)}
              fill={trailColor}
            />
          </React.Fragment>
        )}
        
        <AnimatedSvgPath
          ref={ ref => this._loopOutElement = ref }
          d={d}
          stroke={borderColor}
          fill={fillColor}
          strokeWidth={borderWidth}
        />

        <AnimatedSvgPath
          ref={ ref => this._loopInElement = ref }
          d={d}
          stroke={borderColor}
          fill={fillColor}
          strokeWidth={borderWidth}
        />
      </Svg>
    )
  }

  _setPaths = () => {
    const _headProgression = this._headProgression.__getValue()
    const _tailProgression = this._tailProgression.__getValue()

    const headIn = this.headIn.__getValue()
    const headLoopIn = this.headLoopIn.__getValue()
    const headLoopOut = this.headLoopOut.__getValue()
    const headOut = this.headOut.__getValue()

    const tailIn = this.tailIn.__getValue()
    const tailLoopIn = this.tailLoopIn.__getValue()
    const tailLoopOut = this.tailLoopOut.__getValue()
    const tailOut = this.tailOut.__getValue()

    const loopIntPath = this._getLoopInPath(headIn, headLoopIn,)
    const secondArcSvgPathD = this._getLoopOutPath(headLoopOut, headOut)

    // if(_headProgression <= 2) {
      this._loopInElement && this._loopInElement.setNativeProps({ d: loopIntPath});
    // }
    
    if(_headProgression >= 2) {
      this._loopOutElement && this._loopOutElement.setNativeProps({ d: secondArcSvgPathD});
    } else {
      this._loopOutElement && this._loopOutElement.setNativeProps({ d: 'M 0 0'});
    }
  }
 
  _getLoopInPath = memoize((headIn, headLoopIn) => {
    const {
      width,
      xStartPosition,
      loopRadius,
    } = this.props

    return `
      M
      ${xStartPosition - (width / 2)}
      ${0}

      l
      ${0}
      ${headIn}
      
      a
      ${loopRadius + (width / 2)}
      ${loopRadius + (width / 2)}
      0 0 0
      ${(+1 * Math.cos(headLoopIn) + 1) * (loopRadius + (width / 2))}
      ${(-1 * Math.sin(headLoopIn)) * (loopRadius + (width / 2))}
      
      a
      ${(width / 2) / 6}
      ${(width / 2) / 6}
      0 0 0
      ${(+1 * Math.cos(headLoopIn + Math.PI)) * (width)}
      ${(-1 * Math.sin(headLoopIn + Math.PI)) * (width)}
      
      A
      ${loopRadius - (width / 2)}
      ${loopRadius - (width / 2)}
      0 0 1
      ${xStartPosition + (width / 2)}
      ${headIn}

      L
      ${xStartPosition + (width / 2)}
      ${0}

      a
      ${(width / 2) / 6}
      ${(width / 2) / 6}
      0 0 0
      ${- 2 * (width / 2)}
      ${0}
      Z
    `
  })

  _getLoopOutPath = memoize((headLoopOut, headOut) => {
    const {
      width,
      xStartPosition,
      loopRadius,
    } = this.props

    return `
      M
      ${xStartPosition + (width / 2) + 2 * loopRadius}
      ${1/2}
      
      a
      ${loopRadius + (width / 2)}
      ${loopRadius + (width / 2)}
      0 0 0
      ${(1 * Math.cos(headLoopOut) - 1) * (loopRadius + (width / 2))}
      ${(-1 * Math.sin(headLoopOut)) * (loopRadius + (width / 2))}

      l
      ${0}
      ${headOut}

      a
      ${(width / 2) / 6}
      ${(width / 2) / 6}
      0 0 0
      ${(+1 * Math.cos(headLoopOut + Math.PI)) * (width)}
      ${(-1 * Math.sin(headLoopOut + Math.PI)) * (width)}

      l
      ${0}
      ${-headOut}

      A
      ${loopRadius - (width / 2)}
      ${loopRadius - (width / 2)}
      0 0 1
      ${xStartPosition - (width / 2) + 2 * loopRadius}
      ${1/2}
    `
  })
}

const styles = StyleSheet.create({
  loop: {
    width: '100%',
    aspectRatio: 1,
    // borderWidth: 1,
    borderColor: "grey",
  }
})

export default Loop
