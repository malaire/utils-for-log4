// Copyright (c) 2017 Markus Laire
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

'use strict';

const OUTPUT_SNIPPET_LIMIT = 12;
const TRIM_LIMIT_UA        = 500;

// ------=========----------------
function GetOutput(data_grouped) {
// ------=========----------------
  var data_start_time = (data_grouped.length == 0) ? NaN : data_grouped[0].ms_min;

  var text = '';

  var uA_div      = Number($('input[name=current-divisor]:checked').val());
  var mV_div      = Number($('input[name=voltage-divisor]:checked').val());
  var nW_div      = Number($('input[name=power-divisor]:checked').val());
  var is_grouped  = (parseInt($('input[name=group-size]:checked').val()) > 1);
  var time_format = $('#time-format').val();

  // CONVENTION: when not grouped, output 'minimum' value if any

  var include_time        = (time_format !== '');
  
  var include_current_min = ! isNaN(uA_div) && (! is_grouped || $('#current-min').prop('checked'));
  var include_current_avg = ! isNaN(uA_div) &&    is_grouped && $('#current-avg').prop('checked');
  var include_current_max = ! isNaN(uA_div) &&    is_grouped && $('#current-max').prop('checked');

  var include_voltage_min = ! isNaN(mV_div) && (! is_grouped || $('#voltage-min').prop('checked'));
  var include_voltage_avg = ! isNaN(mV_div) &&    is_grouped && $('#voltage-avg').prop('checked');
  var include_voltage_max = ! isNaN(mV_div) &&    is_grouped && $('#voltage-max').prop('checked');

  var include_power_min   = ! isNaN(nW_div) && (! is_grouped || $('#power-min').prop('checked'));
  var include_power_avg   = ! isNaN(nW_div) &&    is_grouped && $('#power-avg').prop('checked');
  var include_power_max   = ! isNaN(nW_div) &&    is_grouped && $('#power-max').prop('checked');
  
  var current_unit = $('input[name=current-divisor]:checked').attr('data-unit');
  var voltage_unit = $('input[name=voltage-divisor]:checked').attr('data-unit');
  var power_unit   = $('input[name=power-divisor]:checked').attr('data-unit');

  if ($('#column-labels').prop('checked')) {
    var row = [];
    
    if (include_time       ) row.push('time');
    
    if (include_current_min) row.push(current_unit + (is_grouped ? ' min' : ''));
    if (include_current_avg) row.push(current_unit + ' avg');
    if (include_current_max) row.push(current_unit + ' max');
    
    if (include_voltage_min) row.push(voltage_unit + (is_grouped ? ' min' : ''));
    if (include_voltage_avg) row.push(voltage_unit + ' avg');
    if (include_voltage_max) row.push(voltage_unit + ' max');

    if (include_power_min  ) row.push(power_unit   + (is_grouped ? ' min' : ''));
    if (include_power_avg  ) row.push(power_unit   + ' avg');
    if (include_power_max  ) row.push(power_unit   + ' max');
    
    text += row.join(',') + "\n";
  }
  
  data_grouped.forEach(function (input) {
    var {count, ms_min,
         uA_min, uA_max, uA_sum,
         mV_min, mV_max, mV_sum,
         nW_min, nW_max, nW_sum} = input;

    var time;
    if ($('#time-from-zero').prop('checked')) {
      ms_min -= data_start_time;
      time = (new moment.utc(ms_min, 'x')).format(time_format);
    } else {
      time = (new moment(ms_min, 'x')).format(time_format);
    }

    var row = [];

    if (include_time       ) row.push(time);

    if (include_current_min) row.push(uA_min / uA_div);
    if (include_current_avg) row.push(uA_sum / count / uA_div);
    if (include_current_max) row.push(uA_max / uA_div);

    if (include_voltage_min) row.push(mV_min / mV_div);
    if (include_voltage_avg) row.push(mV_sum / count / mV_div);
    if (include_voltage_max) row.push(mV_max / mV_div);

    if (include_power_min  ) row.push(nW_min / nW_div);
    if (include_power_avg  ) row.push(nW_sum / count / nW_div);
    if (include_power_max  ) row.push(nW_max / nW_div);
    
    text += row.join(',') + "\n";
  });
  
  return text;
}

// ------=========---------------------------
function GroupData(data_parsed, limit = -1) {
// ------=========---------------------------
  var data_grouped = [];
  var group_size = parseInt($('input[name=group-size]:checked').val());

  var count = 0;
  var ms_min;
  var uA_min, uA_max, uA_sum;
  var mV_min, mV_max, mV_sum;
  var nW_min, nW_max, nW_sum;

  for (var index = 0; index < data_parsed.length; index++) {
    var [ms, uA, mV] = data_parsed[index];
    var nW = uA * mV;

    if (count == 0) {
      ms_min = ms;
      uA_min = uA_max = uA_sum = uA;
      mV_min = mV_max = mV_sum = mV;
      nW_min = nW_max = nW_sum = nW;
    } else {
      uA_sum += uA;
      mV_sum += mV;
      nW_sum += nW;

      if (uA < uA_min) uA_min = uA;
      if (uA > uA_max) uA_max = uA;
      if (mV < mV_min) mV_min = mV;
      if (mV > mV_max) mV_max = mV;
      if (nW < nW_min) nW_min = nW;
      if (nW > nW_max) nW_max = nW;
    }
    count++;

    if (count == group_size) {
      data_grouped.push({
        'count' : count,
        'ms_min': ms_min,
        'uA_min': uA_min, 'uA_max': uA_max, 'uA_sum': uA_sum,
        'mV_min': mV_min, 'mV_max': mV_max, 'mV_sum': mV_sum,
        'nW_min': nW_min, 'nW_max': nW_max, 'nW_sum': nW_sum,
      });
      count = 0;
      if (data_grouped.length == limit) break;
    }
  };

  if (count > 0) {
    data_grouped.push({
      'count' : count,
      'ms_min': ms_min,
      'uA_min': uA_min, 'uA_max': uA_max, 'uA_sum': uA_sum,
      'mV_min': mV_min, 'mV_max': mV_max, 'mV_sum': mV_sum,
      'nW_min': nW_min, 'nW_max': nW_max, 'nW_sum': nW_sum,
    });
  }

  return data_grouped;
}

// ------==========----
function ParseInput() {
// ------==========----
  var data_parsed = [];
  
  var trimming_beginning = $('#trim-begin').prop('checked');
  
  var lines = $('#input').val().replace(' ', '').split(/\r\n|\r|\n/g);
  lines.forEach(function (line) {
    if (line === '') return;
    
    var values = line.split(',');
    var ms = parseInt(values[0]);
    var uA = parseInt(values[1]);
    var mV = parseInt(values[2]);
    
    if (trimming_beginning) {
      if (uA <= TRIM_LIMIT_UA) return;
      trimming_beginning = false;
    }
    
    data_parsed.push([ ms, uA, mV ]);
  });
  
  return data_parsed;
}

// ------==============----
function ShowFullOutput() {
// ------==============----
  var data_grouped = GroupData(ParseInput());
  $('#output-snippet').val(GetOutput(data_grouped));
}

// ------===================----
function UpdateOutputSnippet() {
// ------===================----
  var data_grouped = GroupData(ParseInput(), OUTPUT_SNIPPET_LIMIT);
  $('#output-snippet').val(GetOutput(data_grouped) + "...\n");
}
