import React from 'react'
import { StyleSheet, View } from 'react-native'
import memoize from 'fast-memoize'
import { Svg } from 'expo'

import Animated, { Easing } from 'react-native-reanimated'

const {
  add,
  and,
  block,
  call,
  concat,
  cond,
  cos,
  debug,
  divide,
  greaterThan,
  interpolate,
  lessOrEq,
  lessThan,
  multiply,
  not,
  or,
  sin,
  sub,
  Value,
} = Animated

export const RESOLUTION = 10

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
      width,
      xStartPosition,
      loopRadius,
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

    const headIn = interpolate(headProgression, interpolations.in)
    const headLoopIn = interpolate(headProgression, interpolations.loopIn)
    const headLoopOut = interpolate(headProgression, interpolations.loopOut)

    const tailIn = interpolate(tailProgression, interpolations.in)
    const tailLoopIn = interpolate(tailProgression, interpolations.loopIn)
    const tailLoopOut = interpolate(tailProgression, interpolations.loopOut)

    const halfWidth = divide(width, 2)
    const cosHeadLoop = cos(headLoopIn)
    const sinHeadLoop = sin(headLoopIn)
    const cosTailLoop = cos(tailLoopIn)
    const sinTailLoop = sin(tailLoopIn)
    const cosTailLoopPlusPI = cos(add(tailLoopIn, Math.PI))
    const sinTailLoopPlusPI = sin(add(tailLoopIn, Math.PI))
    const innerRadius = sub(loopRadius, halfWidth)
    const outterRadius = add(loopRadius, halfWidth)
    const capRadius = divide(halfWidth, 6)

    const headloopInt = {
      x: add(xStartPosition, halfWidth, multiply(add(cosHeadLoop, 1), innerRadius)),
      y: sub(headIn, multiply(sinHeadLoop, innerRadius)),
    }
    const tailLoopInt = {
      x: add(xStartPosition, halfWidth, multiply(add(cosTailLoop, 1), innerRadius)),
      y: sub(headIn, multiply(sinTailLoop, innerRadius)),
    }
    const tailInInt = {
      dx: new Value(0),
      dy: add(-1, tailIn),
    }
    const tailInExt = {
      dx: new Value(0),
      dy: sub(1, tailIn),
    }

    const tailLoopExt = {
      dx: multiply(-1, cosTailLoopPlusPI, width),
      dy: multiply(sinTailLoopPlusPI, width)
    }
    const headloopExt = {
      x: sub(xStartPosition, add(halfWidth, multiply(add(cosHeadLoop, 1), outterRadius))),
      y: sub(headIn, multiply(sinHeadLoop, outterRadius)),
    }

    const path = concat(
      'M',
      multiply(headloopInt.x, RESOLUTION),
      multiply(headloopInt.y, RESOLUTION),
      
      'A',
      multiply(innerRadius, RESOLUTION),
      multiply(innerRadius, RESOLUTION),
      '0 0 1',
      multiply(tailLoopInt.x, RESOLUTION),
      multiply(tailLoopInt.y, RESOLUTION),

      'l',
      multiply(tailInInt.dx, RESOLUTION),
      multiply(tailInInt.dy, RESOLUTION),

      'a',
      multiply(capRadius, RESOLUTION),
      multiply(capRadius, RESOLUTION),
      '0 0 0',
      multiply(tailLoopExt.dx, RESOLUTION),
      multiply(tailLoopExt.dy, RESOLUTION),

      'l',
      multiply(tailInExt.dx, RESOLUTION),
      multiply(tailInExt.dy, RESOLUTION),

      'A',
      multiply(outterRadius, RESOLUTION),
      multiply(outterRadius, RESOLUTION),
      '0 0 0',
      multiply(headloopExt.x, RESOLUTION),
      multiply(headloopExt.y, RESOLUTION),
    )
  
    const cap = cond(lessThan(headLoopIn, 2 * Math.PI),
      concat(
        'A',
        multiply(capRadius, RESOLUTION),
        multiply(capRadius, RESOLUTION),
        '0 0 0',
        multiply(headloopInt.x, RESOLUTION),
        multiply(headloopInt.y, RESOLUTION),
      ),
      ''
    )
    this._wholeInPath = concat(
      path,
      cap,
    )


    // tailLoopOut, headLoopOut, hasHead
    
    // _getWholeOutPaths = memoize((tailLoop, headLoop, hasHead) => {
    //   const {
    //     width,
    //     xStartPosition,
    //     loopRadius,
    //   } = this.props
      
    //   center = {
    //     x: xStartPosition + loopRadius,
    //     y: 1,
    //   }
  
    //   const halfWidth = width / 2
    //   const cosHeadLoop = Math.cos(headLoop)
    //   const sinHeadLoop = Math.sin(headLoop)
    //   const cosTailLoop = Math.cos(tailLoop)
    //   const sinTailLoop = Math.sin(tailLoop)
    //   const innerRadius = loopRadius - halfWidth
    //   const outterRadius = loopRadius + halfWidth
    //   const capRadius = halfWidth / 6
  
    //   const tailLoopExt = { // OK
    //     x: center.x + cosTailLoop * outterRadius,
    //     y: center.y + -1 * sinTailLoop * outterRadius,
    //   }
    //   const headLoopExt = {
    //     x: center.x + cosHeadLoop * outterRadius,
    //     y: center.y + -1 * sinHeadLoop * outterRadius,
    //   }
    //   const headLoopInt = {
    //     x: center.x + cosHeadLoop * innerRadius,
    //     y: center.y - sinHeadLoop * innerRadius,
    //   }
    //   const tailLoopInt = {
    //     x: center.x + cosTailLoop * innerRadius,
    //     y: center.y - sinTailLoop * innerRadius,
    //   }
  
    //   const wholeOutFillPath = (tailLoop >= Math.PI) ?
    //   'M 0 0'
    //   :
    //   `
    //     M
    //     ${tailLoopExt.x * RESOLUTION}
    //     ${tailLoopExt.y * RESOLUTION}
  
    //     A
    //     ${(loopRadius + halfWidth) * RESOLUTION}
    //     ${(loopRadius + halfWidth) * RESOLUTION}
    //     0 0 0
    //     ${headLoopExt.x * RESOLUTION}
    //     ${headLoopExt.y * RESOLUTION}
  
    //     ${
    //       hasHead ? `
    //       L
    //       ${headLoopInt.x * RESOLUTION}
    //       ${headLoopInt.y * RESOLUTION}
    //       ` : `
    //       A
    //       ${capRadius * RESOLUTION}
    //       ${capRadius * RESOLUTION}
    //       0 0 0
    //       ${headLoopInt.x * RESOLUTION}
    //       ${headLoopInt.y * RESOLUTION}
    //       `
    //     }
  
    //     A
    //     ${innerRadius * RESOLUTION}
    //     ${innerRadius * RESOLUTION}
    //     0 0 1
    //     ${tailLoopInt.x * RESOLUTION}
    //     ${tailLoopInt.y * RESOLUTION}
  
    //     A
    //     ${capRadius * RESOLUTION}
    //     ${capRadius * RESOLUTION}
    //     0 0 0
    //     ${tailLoopExt.x * RESOLUTION}
    //     ${tailLoopExt.y * RESOLUTION}
    //   `
  
    //   const wholeOutBorderPath = (tailLoop >= Math.PI) ?
    //     'M 0 0'
    //     :
    //     `
    //     M
    //     ${tailLoopExt.x * RESOLUTION}
    //     ${tailLoopExt.y * RESOLUTION}
  
    //     A
    //     ${(loopRadius + halfWidth) * RESOLUTION}
    //     ${(loopRadius + halfWidth) * RESOLUTION}
    //     0 0 0
    //     ${headLoopExt.x * RESOLUTION}
    //     ${headLoopExt.y * RESOLUTION}
  
    //     ${
    //       hasHead ? `
    //       M
    //       ${headLoopInt.x * RESOLUTION}
    //       ${headLoopInt.y * RESOLUTION}
    //       ` : `
    //       A
    //       ${capRadius * RESOLUTION}
    //       ${capRadius * RESOLUTION}
    //       0 0 0
    //       ${headLoopInt.x * RESOLUTION}
    //       ${headLoopInt.y * RESOLUTION}
    //       `
    //     }
        
    //     A
    //     ${innerRadius * RESOLUTION}
    //     ${innerRadius * RESOLUTION}
    //     0 0 1
    //     ${tailLoopInt.x * RESOLUTION}
    //     ${tailLoopInt.y * RESOLUTION}
  
    //     A
    //     ${capRadius * RESOLUTION}
    //     ${capRadius * RESOLUTION}
    //     0 0 0
    //     ${tailLoopExt.x * RESOLUTION}
    //     ${tailLoopExt.y * RESOLUTION}
    //   `
  
    //   return {
    //     wholeOutFillPath,
    //     wholeOutBorderPath,
    //   }
    // })

    // this._wholeOutFillPath = new Value()
    // this._wholeOutBorderPath = new Value()
  }

  render() {
    const {
      fillColor,
      borderColor,
      borderWidth,
      trailColor,
      tailProgression,
      headProgression,
    } = this.props

    const d = 'M 0 0'
    const force = new Value(0)
    return (
      <View>
        <Animated.Code>
          { () => (
            // block([
            //   debug('this.path', this._wholeInPath),
            // ])
            cond(not( // to avoid the return (see previous code)
              and(
                not(force),
                or(
                  lessThan(tailProgression, this._getStep(0)),
                  greaterThan(tailProgression, this._getStep(3))
                ),
                or(
                  lessThan(headProgression, this._getStep(0)),
                  greaterThan(headProgression, this._getStep(3))
                )
              ),
            ),
              block([
                cond(
                  or(
                    lessOrEq(headProgression, this._getStep(2)),
                    lessOrEq(tailProgression, this._getStep(2)),
                  ),
                    call([ this._wholeInPath ], ([ wholeIntPath, ]) => {
                      this._loopInElement && this._loopInElement.setNativeProps({ d: wholeIntPath })
                    }),
                    call([], () => {
                      this._loopInElement && this._loopInElement.setNativeProps({ d: 'M 0 0' })
                    })
                ),
                // cond(
                //   and(
                //     greaterThan(
                //       headProgression,
                //       this._getStep(2),
                //     ),
                //     lessOrEq(
                //       tailProgression,
                //       this._getStep(3),
                //     )
                //   ),
                //     block([
                //       call([ this._wholeOutFillPath ], ([ wholeOutFillPath, ]) => {
                //         this._loopOutFillElement && this._loopOutFillElement.setNativeProps({ d: wholeOutFillPath })
                //       }),
                //       call([ this._wholeOutBorderPath ], ([ wholeOutBorderPath, ]) => {
                //         this._loopOutBorderElement && this._loopOutBorderElement.setNativeProps({ d: wholeOutBorderPath })
                //       }),
                //     ]),
                //     call([], () => {
                //       this._loopOutFillElement && this._loopOutFillElement.setNativeProps({ d: 'M 0 0' })
                //     }),
                // )
              ])
            )
          )}
        </Animated.Code>
        <Svg
          style={styles.loop}
          viewBox={`0 0 ${RESOLUTION} ${RESOLUTION * 2}`}
        > 
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
      </View>
    )
  }

  _getStep = memoize((ratio) => {
    const {
      startsAt,
      endsAt,
    } = this.props

    
    return startsAt + ratio / 3 * Math.abs(endsAt - startsAt)
  })
}

const styles = StyleSheet.create({
  loop: {
    width: '100%',
    aspectRatio: 1/3,
  }
})

export default Loop
