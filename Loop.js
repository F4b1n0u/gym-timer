import React from 'react'
import { StyleSheet, Animated, View, Easing } from 'react-native'
import memoize from 'fast-memoize'
import { Svg } from 'expo'
import Color from 'color'

const AnimatedSvgPath = Animated.createAnimatedComponent(Svg.Path)

class Loop extends React.Component {
  constructor(props) {
    super(props)

    const {
      width,
      borderWidth,
      easings: {
        in: easingIn,
        loopStart: easingLoopStart,
        loopEnd: easingLoopEnd,
        out: easingOut,
      },
    } = props

    this._progression = new Animated.Value(0)

    this.tailPositionDelta = this._progression.interpolate({
      inputRange:  [0,                      1],
      outputRange: [-width/2 - borderWidth, 1/2],
      extrapolate: 'clamp',
      easing: easingIn,
      useNativeDriver: true,
    })

    this.firstArcRotationProgression = this._progression.interpolate({
      inputRange:  [1,       2],
      outputRange: [Math.PI, Math.PI * 2],
      extrapolate: 'clamp',
      easing: easingLoopStart,
      useNativeDriver: true,
    })

    this.secondArcRotationProgression = this._progression.interpolate({
      inputRange:  [2, 3],
      outputRange: [0, Math.PI],
      extrapolate: 'clamp',
      easing: easingLoopEnd,
      useNativeDriver: true,
    })

    this.headPositionDelta = this._progression.interpolate({
      inputRange:  [3, 4],
      outputRange: [0, 3/6 + width/2 ],
      extrapolate: 'clamp',
      easing: easingOut,
      useNativeDriver: true,
    })

    this._progression.addListener(this._setArcsSvgPathD)
  }
  
  _startAnimation = () => {
    const {
      durations: {
        in: durationIn,
        loopStart: durationLoopStart,
        loopEnd: durationLoopEnd,
        out: durationOut,
      },
    } = this.props

    Animated.sequence([
      Animated.timing(
        this._progression,
        {
          toValue: 1,
          duration: durationIn,
          seNativeDriver: true,
          isInteraction: false,
        },
      ),
      Animated.timing(
        this._progression,
        {
          toValue: 2,
          duration: durationLoopStart,
          seNativeDriver: true,
          isInteraction: false,
        },
      ),
      Animated.timing(
        this._progression,
        {
          toValue: 3,
          duration: durationLoopEnd,
          seNativeDriver: true,
          isInteraction: false,
        },
      ),
      Animated.timing(
        this._progression,
        {
          toValue: 4,
          duration: durationOut,
          seNativeDriver: true,
          isInteraction: false,
        },
      )
    ]).start(() => {
      Animated.timing(
        this._progression,
        {
          toValue: 0,
          duration: 10000,
          seNativeDriver: true,
          isInteraction: false,
        },
      ).start()
      // this._progression.setValue(0)
      // this._startAnimation()
    })
  }

  componentDidMount() {
    this._setArcsSvgPathD({ value: this._progression.__getValue() })

    this._startAnimation()
  }

  componentWillMount() {
    this._progression.removeListener(this._setFirstArcSvgPathD);
  }

  render() {
    let {
      fillColor,
      borderColor,
      borderWidth,
    } = this.props

    fillColor = Color(fillColor)
    trailColor = fillColor.lightness(8)
    borderColor = Color(borderColor)
    
    const d = 'M 0 0'

    return (
      <Svg
        style={styles.loop}
        viewBox={`0 0 1 1`}
      >
        <AnimatedSvgPath
          d={this._getFirstArcSvgPathD(3/6, Math.PI * 2)}
          fill={trailColor.hex()}
        />
        <AnimatedSvgPath
          d={this._getSecondArcSvgPathD(Math.PI, 3/6)}
          fill={trailColor.hex()}
        />

        <AnimatedSvgPath
          ref={ ref => this._firstArcSvgPath = ref }
          d={d}
          stroke={borderColor.hex()}
          fill={fillColor.hex()}
          strokeWidth={borderWidth}
        />
        
        <AnimatedSvgPath
          ref={ ref => this._secondArcSvgPath = ref }
          d={d}
          stroke={borderColor.hex()}
          fill={fillColor.hex()}
          strokeWidth={borderWidth}
        />
      </Svg>
    )
  }

  _setArcsSvgPathD = (progression) => {
    if (progression.value < 0 || progression.value > 4) {
      return null
    }

    const tailPositionDeltaValue = this.tailPositionDelta.__getValue()
    const firstArcRotationProgressionValue = this.firstArcRotationProgression.__getValue()

    const secondArcRotationProgression = this.secondArcRotationProgression.__getValue()
    const headPositionDelta = this.headPositionDelta.__getValue()

    const firstArcSvgPathD= this._getFirstArcSvgPathD(tailPositionDeltaValue, firstArcRotationProgressionValue)
    const secondArcSvgPathD= this._getSecondArcSvgPathD(secondArcRotationProgression, headPositionDelta)

    this._firstArcSvgPath && this._firstArcSvgPath.setNativeProps({ d: firstArcSvgPathD});
    
    if(progression.value > 2) {
      this._secondArcSvgPath && this._secondArcSvgPath.setNativeProps({ d: secondArcSvgPathD});
    } else {
      this._secondArcSvgPath && this._secondArcSvgPath.setNativeProps({ d: 'M 0 0'});
    }
  }
 
  _getFirstArcSvgPathD = memoize((tailPositionDeltaValue, firstArcRotationProgressionValue) => {
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
      ${tailPositionDeltaValue}
      
      a
      ${loopRadius + (width / 2)}
      ${loopRadius + (width / 2)}
      0 0 0
      ${(+1 * Math.cos(firstArcRotationProgressionValue) + 1) * (loopRadius + (width / 2))}
      ${(-1 * Math.sin(firstArcRotationProgressionValue)) * (loopRadius + (width / 2))}
      
      a
      ${(width / 2) / 6}
      ${(width / 2) / 6}
      0 0 0
      ${(+1 * Math.cos(firstArcRotationProgressionValue + Math.PI)) * (width)}
      ${(-1 * Math.sin(firstArcRotationProgressionValue + Math.PI)) * (width)}

      A
      ${loopRadius - (width / 2)}
      ${loopRadius - (width / 2)}
      0 0 1
      ${xStartPosition + (width / 2)}
      ${tailPositionDeltaValue}

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

  _getSecondArcSvgPathD = memoize((secondArcRotationProgressionValue, headPositionDeltaValue) => {
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
      ${(1 * Math.cos(secondArcRotationProgressionValue) - 1) * (loopRadius + (width / 2))}
      ${(-1 * Math.sin(secondArcRotationProgressionValue)) * (loopRadius + (width / 2))}

      l
      ${0}
      ${headPositionDeltaValue}

      a
      ${(width / 2) / 6}
      ${(width / 2) / 6}
      0 0 0
      ${(+1 * Math.cos(secondArcRotationProgressionValue + Math.PI)) * (width)}
      ${(-1 * Math.sin(secondArcRotationProgressionValue + Math.PI)) * (width)}

      l
      ${0}
      ${-headPositionDeltaValue}

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
