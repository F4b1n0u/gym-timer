import React from 'react'
import { StyleSheet, Easing, Text, View, Dimensions } from 'react-native'
import memoize from 'fast-memoize'
import { Svg } from 'expo'

const ANIMATION_PRECISION = 4
const RESOLUTION = 10
class Loop extends React.Component {
  constructor(props) {
    super(props)

    const {
      headProgression,
      tailProgression,
      easings: {
        loopIn: easingLoopIn,
        loopOut: easingLoopOut,
      },
    } = props

    const interpolations = {
      in: {
        inputRange:  [this._getStep(0), this._getStep(1)],
        outputRange: [0,                1],
        easing: Easing.inOut(Easing.linear),
        extrapolate: 'clamp',
        useNativeDriver: true,
      },
      loopIn: {
        inputRange:  [this._getStep(1), this._getStep(2)],
        outputRange: [Math.PI,    Math.PI * 2],
        easing: easingLoopIn,
        extrapolate: 'clamp',
        useNativeDriver: true,
      },
      loopOut: {
        inputRange:  [this._getStep(2), this._getStep(3)],
        outputRange: [0,                Math.PI],
        easing: easingLoopOut,
        extrapolate: 'clamp',
        useNativeDriver: true,
      },
    }

    this.headIn = headProgression.interpolate(interpolations.in)
    this.headLoopIn = headProgression.interpolate(interpolations.loopIn)
    this.headLoopOut = headProgression.interpolate(interpolations.loopOut)

    this.tailIn = tailProgression.interpolate(interpolations.in)
    this.tailLoopIn = tailProgression.interpolate(interpolations.loopIn)
    this.tailLoopOut = tailProgression.interpolate(interpolations.loopOut)
  }

  componentWillMount() {
    const {
      headProgression,
      tailProgression,
    } = this.props

    headProgression.addListener(this._setPaths)
    tailProgression.addListener(this._setPaths)
  }

  componentWillUnmount() {
    const {
      headProgression,
      tailProgression,
    } = this.props
    
    headProgression.removeListener(this._setPaths)
    tailProgression.removeListener(this._setPaths)
  }

  componentDidMount() {
    this._setPaths('whatever', true)
  }

  render() {
    const {
      fillColor,
      borderColor,
      borderWidth,
      trailColor,
    } = this.props

    const d = 'M 0 0'
    
    return (
      <Svg
        style={styles.loop}
        viewBox={`0 0 ${RESOLUTION} ${RESOLUTION * 2}`}
      >
        {trailColor && (
          <React.Fragment>
            <Svg.Path
              d={this._getWholeInPath(0, 1, Math.PI, 2 * Math.PI)}
              fill={trailColor}
            />
            <Svg.Path
              d={this._getWholeOutPaths(0, Math.PI)}
              fill={trailColor}
            />
          </React.Fragment>
        )}
        
        <Svg.Path
          ref={ ref => this._loopOutFillElement = ref }
          d={d}
          fill={fillColor}
        />
          <Svg.Path
          ref={ ref => this._loopOutBorderElement = ref }
          d={d}
          stroke={borderColor}
          fillOpacity={0}
          strokeWidth={borderWidth}
        />

        <Svg.Path
          ref={ ref => this._loopInElement = ref }
          d={d}
          stroke={borderColor}
          fill={fillColor}
          strokeWidth={borderWidth}
        />
      </Svg>
    )
  }

  _getStep = memoize((ratio) => {
    const {
      startsAt,
      endsAt,
    } = this.props

    
    return startsAt + ratio / 3 * Math.abs(endsAt - startsAt)
  })

  _setPaths = (value, force = false) => {
    let {
      headProgression,
      tailProgression,
    } = this.props

    
    headProgression = headProgression.__getValue()
    tailProgression = tailProgression.__getValue()

    if (
      !force &&
      (tailProgression < this._getStep(0) || tailProgression > this._getStep(3)) &&
      (headProgression < this._getStep(0) || headProgression > this._getStep(3))
    ) {
      return
    }

    if(headProgression <= this._getStep(2) || tailProgression <= this._getStep(2)) {
      const headIn = Number(this.headIn.__getValue().toFixed(ANIMATION_PRECISION))
      const headLoopIn = Number(this.headLoopIn.__getValue().toFixed(ANIMATION_PRECISION))
      const tailLoopIn = Number(this.tailLoopIn.__getValue().toFixed(ANIMATION_PRECISION))
      const tailIn = Number(this.tailIn.__getValue().toFixed(ANIMATION_PRECISION))
      const wholeIntPath = this._getWholeInPath(tailIn, headIn, tailLoopIn, headLoopIn)

      this._loopInElement && this._loopInElement.setNativeProps({ d: wholeIntPath});
    } else {
      this._loopInElement && this._loopInElement.setNativeProps({ d: 'M 0 0' });
    }
    
    if(headProgression > this._getStep(2) && tailProgression <= this._getStep(3)) {
      const headLoopOut = Number(this.headLoopOut.__getValue().toFixed(ANIMATION_PRECISION))
      const tailLoopOut = Number(this.tailLoopOut.__getValue().toFixed(ANIMATION_PRECISION))
      const hasHead = headProgression > this._getStep(3)
      const { wholeOutFillPath, wholeOutBorderPath } = this._getWholeOutPaths(tailLoopOut, headLoopOut, hasHead)

      this._loopOutFillElement && this._loopOutFillElement.setNativeProps({ d: wholeOutFillPath })
      this._loopOutBorderElement && this._loopOutBorderElement.setNativeProps({ d: wholeOutBorderPath })
    } else {
      this._loopOutFillElement && this._loopOutFillElement.setNativeProps({ d: 'M 0 0'})
    }
  }
 
  _getWholeInPath = memoize((tailIn, headIn, tailLoop, headLoop) => {
    const {
      width,
      xStartPosition,
      loopRadius,
    } = this.props

    const halfWidth = width / 2
    const cosHeadLoop = Math.cos(headLoop)
    const sinHeadLoop = Math.sin(headLoop)
    const cosTailLoop = Math.cos(tailLoop)
    const sinTailLoop = Math.sin(tailLoop)
    const cosTailLoopPlusPI = Math.cos(tailLoop + Math.PI)
    const sinTailLoopPlusPI = Math.sin(tailLoop + Math.PI)
    const innerRadius = loopRadius - halfWidth
    const outterRadius = loopRadius + halfWidth
    const capRadius = halfWidth / 6


    const headloopInt = {
      x: xStartPosition + halfWidth + (cosHeadLoop + 1) * innerRadius,
      y: headIn - sinHeadLoop * innerRadius,
    }
    const tailLoopInt = {
      x: xStartPosition + halfWidth + ((cosTailLoop + 1) * innerRadius),
      y: headIn - (1 * sinTailLoop) * innerRadius,
    }
    const tailInInt = {
      dx: 0,
      dy: -1 + tailIn,
    }
    const tailInExt = {
      dx: 0,
      dy: 1 - tailIn,
    }

    const tailLoopExt = {
      dx: -cosTailLoopPlusPI * width,
      dy: sinTailLoopPlusPI * width
    }
    const headloopExt = {
      x: xStartPosition - halfWidth + ((cosHeadLoop + 1) * outterRadius),
      y: headIn - sinHeadLoop * outterRadius,
    }
    
    const path = `
      M
      ${headloopInt.x * RESOLUTION}
      ${headloopInt.y * RESOLUTION}
      
      A
      ${innerRadius * RESOLUTION}
      ${innerRadius * RESOLUTION}
      0 0 1
      ${tailLoopInt.x * RESOLUTION}
      ${tailLoopInt.y * RESOLUTION}

      l
      ${tailInInt.dx * RESOLUTION}
      ${tailInInt.dy * RESOLUTION}

      a
      ${capRadius * RESOLUTION}
      ${capRadius * RESOLUTION}
      0 0 0
      ${tailLoopExt.dx * RESOLUTION}
      ${tailLoopExt.dy * RESOLUTION}

      l
      ${tailInExt.dx * RESOLUTION}
      ${tailInExt.dy * RESOLUTION}

      A
      ${outterRadius * RESOLUTION}
      ${outterRadius * RESOLUTION}
      0 0 0
      ${headloopExt.x * RESOLUTION}
      ${headloopExt.y * RESOLUTION}
    `

    const cap = headLoop < 2 * Math.PI ? `
      A
      ${capRadius * RESOLUTION}
      ${capRadius * RESOLUTION}
      0 0 0
      ${headloopInt.x * RESOLUTION}
      ${headloopInt.y * RESOLUTION}
    ` : ''

    return `
      ${path}
      ${cap}
    `
  })

  _getWholeOutPaths = memoize((tailLoop, headLoop, hasHead) => {
    const {
      width,
      xStartPosition,
      loopRadius,
    } = this.props
    
    center = {
      x: xStartPosition + loopRadius,
      y: 1,
    }

    const halfWidth = width / 2
    const cosHeadLoop = Math.cos(headLoop)
    const sinHeadLoop = Math.sin(headLoop)
    const cosTailLoop = Math.cos(tailLoop)
    const sinTailLoop = Math.sin(tailLoop)
    const innerRadius = loopRadius - halfWidth
    const outterRadius = loopRadius + halfWidth
    const capRadius = halfWidth / 6

    const tailLoopExt = { // OK
      x: center.x + cosTailLoop * outterRadius,
      y: center.y + -1 * sinTailLoop * outterRadius,
    }
    const headLoopExt = {
      x: center.x + cosHeadLoop * outterRadius,
      y: center.y + -1 * sinHeadLoop * outterRadius,
    }
    const headLoopInt = {
      x: center.x + cosHeadLoop * innerRadius,
      y: center.y - sinHeadLoop * innerRadius,
    }
    const tailLoopInt = {
      x: center.x + cosTailLoop * innerRadius,
      y: center.y - sinTailLoop * innerRadius,
    }

    const wholeOutFillPath = (tailLoop >= Math.PI) ?
    'M 0 0'
    :
    `
      M
      ${tailLoopExt.x * RESOLUTION}
      ${tailLoopExt.y * RESOLUTION}

      A
      ${(loopRadius + halfWidth) * RESOLUTION}
      ${(loopRadius + halfWidth) * RESOLUTION}
      0 0 0
      ${headLoopExt.x * RESOLUTION}
      ${headLoopExt.y * RESOLUTION}

      ${
        hasHead ? `
        L
        ${headLoopInt.x * RESOLUTION}
        ${headLoopInt.y * RESOLUTION}
        ` : `
        A
        ${capRadius * RESOLUTION}
        ${capRadius * RESOLUTION}
        0 0 0
        ${headLoopInt.x * RESOLUTION}
        ${headLoopInt.y * RESOLUTION}
        `
      }

      A
      ${innerRadius * RESOLUTION}
      ${innerRadius * RESOLUTION}
      0 0 1
      ${tailLoopInt.x * RESOLUTION}
      ${tailLoopInt.y * RESOLUTION}

      A
      ${capRadius * RESOLUTION}
      ${capRadius * RESOLUTION}
      0 0 0
      ${tailLoopExt.x * RESOLUTION}
      ${tailLoopExt.y * RESOLUTION}
    `

    const wholeOutBorderPath = (tailLoop >= Math.PI) ?
      'M 0 0'
      :
      `
      M
      ${tailLoopExt.x * RESOLUTION}
      ${tailLoopExt.y * RESOLUTION}

      A
      ${(loopRadius + halfWidth) * RESOLUTION}
      ${(loopRadius + halfWidth) * RESOLUTION}
      0 0 0
      ${headLoopExt.x * RESOLUTION}
      ${headLoopExt.y * RESOLUTION}

      ${
        hasHead ? `
        M
        ${headLoopInt.x * RESOLUTION}
        ${headLoopInt.y * RESOLUTION}
        ` : `
        A
        ${capRadius * RESOLUTION}
        ${capRadius * RESOLUTION}
        0 0 0
        ${headLoopInt.x * RESOLUTION}
        ${headLoopInt.y * RESOLUTION}
        `
      }
      
      A
      ${innerRadius * RESOLUTION}
      ${innerRadius * RESOLUTION}
      0 0 1
      ${tailLoopInt.x * RESOLUTION}
      ${tailLoopInt.y * RESOLUTION}

      A
      ${capRadius * RESOLUTION}
      ${capRadius * RESOLUTION}
      0 0 0
      ${tailLoopExt.x * RESOLUTION}
      ${tailLoopExt.y * RESOLUTION}
    `

    return {
      wholeOutFillPath,
      wholeOutBorderPath,
    }
  })
}

const styles = StyleSheet.create({
  loop: {
    width: '100%',
    aspectRatio: 1/3,
  }
})

export default Loop
