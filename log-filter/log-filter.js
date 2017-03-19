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

// ------=========------------------
function GetOutput(dataset, limit) {
// ------=========------------------
  var data = dataset['data'];
  var text = '';
  
  var sum_count = 0;

  var ms_first;
  var uA_min, uA_max, uA_sum, uA_avg;
  var mV_min, mV_max, mV_sum, mV_avg;
  var nW_min, nW_max, nW_sum, nW_avg;

  var uA_div      = Number($('input[name=current-divisor]:checked').val());
  var mV_div      = Number($('input[name=voltage-divisor]:checked').val());
  var nW_div      = Number($('input[name=power-divisor]:checked').val());
  var avg_count   = parseInt($('input[name=group-size]:checked').val());
  var time_format = $('#time-format').val();

  var include_time        = (time_format !== '');

  var include_current     = ! isNaN(uA_div) && (avg_count == 1);
  var include_voltage     = ! isNaN(mV_div) && (avg_count == 1);
  var include_power       = ! isNaN(nW_div) && (avg_count == 1);
  
  var include_current_min = ! isNaN(uA_div) && (avg_count > 1) && $('#current-min').prop('checked');
  var include_current_avg = ! isNaN(uA_div) && (avg_count > 1) && $('#current-avg').prop('checked');
  var include_current_max = ! isNaN(uA_div) && (avg_count > 1) && $('#current-max').prop('checked');

  var include_voltage_min = ! isNaN(mV_div) && (avg_count > 1) && $('#voltage-min').prop('checked');
  var include_voltage_avg = ! isNaN(mV_div) && (avg_count > 1) && $('#voltage-avg').prop('checked');
  var include_voltage_max = ! isNaN(mV_div) && (avg_count > 1) && $('#voltage-max').prop('checked');

  var include_power_min   = ! isNaN(nW_div) && (avg_count > 1) && $('#power-min').prop('checked');
  var include_power_avg   = ! isNaN(nW_div) && (avg_count > 1) && $('#power-avg').prop('checked');
  var include_power_max   = ! isNaN(nW_div) && (avg_count > 1) && $('#power-max').prop('checked');
  
  var current_unit = $('input[name=current-divisor]:checked').attr('data-unit');
  var voltage_unit = $('input[name=voltage-divisor]:checked').attr('data-unit');
  var power_unit   = $('input[name=power-divisor]:checked').attr('data-unit');
  
  var output_lines = 0;

  if ($('#column-labels').prop('checked')) {
    var row = [];
    
    if (include_time       ) row.push('time');
    
    if (include_current    ) row.push(current_unit);
    if (include_current_min) row.push(current_unit + ' min');
    if (include_current_avg) row.push(current_unit + ' avg');
    if (include_current_max) row.push(current_unit + ' max');
    
    if (include_voltage    ) row.push(voltage_unit);
    if (include_voltage_min) row.push(voltage_unit + ' min');
    if (include_voltage_avg) row.push(voltage_unit + ' avg');
    if (include_voltage_max) row.push(voltage_unit + ' max');

    if (include_power      ) row.push(power_unit);
    if (include_power_min  ) row.push(power_unit   + ' min');
    if (include_power_avg  ) row.push(power_unit   + ' avg');
    if (include_power_max  ) row.push(power_unit   + ' max');
    
    text += row.join(',') + "\n";
  }
  
  var skipped_some = false;
  data.forEach(function (values, index) {
    if (output_lines >= limit) {
      skipped_some = true;
      return;
    }
    
    var ms = values[0];
    var uA = values[1];
    var mV = values[2];
    var nW = uA * mV;
    
    if (avg_count > 1) {
      if (sum_count == 0) {
        ms_first = ms;
        uA_min   = 1e15;
        uA_max   = -1e15;
        uA_sum   = 0;
        mV_min   = 1e15;
        mV_max   = -1e15;
        mV_sum   = 0
        nW_min   = 1e15;
        nW_max   = -1e15;
        nW_sum   = 0
      }
      
      sum_count++;
      uA_sum += uA;
      mV_sum += mV;
      nW_sum += nW;
      
      if (uA < uA_min) uA_min = uA;
      if (uA > uA_max) uA_max = uA;
      if (mV < mV_min) mV_min = mV;
      if (mV > mV_max) mV_max = mV;
      if (nW < nW_min) nW_min = nW;
      if (nW > nW_max) nW_max = nW;
      
      if (sum_count < avg_count &&
          ! (index + 1 == data.length &&
             $('#include-last-partial').prop('checked'))) return;
      
      ms = ms_first;
      uA_avg = uA_sum / sum_count;
      mV_avg = mV_sum / sum_count;
      nW_avg = nW_sum / sum_count;
      
      sum_count = 0;
    }
    
    output_lines++;

    var time
    if ($('#time-from-zero').prop('checked')) {
      ms = ms - dataset['ms_min'];
      time = (new moment.utc(ms, 'x')).format(time_format);
    } else {
      time = (new moment(ms, 'x')).format(time_format);
    }

    var row = [];
    
    if (include_time       ) row.push(time);
    
    if (include_current    ) row.push(uA     / uA_div);
    if (include_current_min) row.push(uA_min / uA_div);
    if (include_current_avg) row.push(uA_avg / uA_div);
    if (include_current_max) row.push(uA_max / uA_div);

    if (include_voltage    ) row.push(mV     / mV_div);
    if (include_voltage_min) row.push(mV_min / mV_div);
    if (include_voltage_avg) row.push(mV_avg / mV_div);
    if (include_voltage_max) row.push(mV_max / mV_div);

    if (include_power      ) row.push(nW     / nW_div);
    if (include_power_min  ) row.push(nW_min / nW_div);
    if (include_power_avg  ) row.push(nW_avg / nW_div);
    if (include_power_max  ) row.push(nW_max / nW_div);
    
    text += row.join(',') + "\n";
  });
  
  if (skipped_some) text += "...\n";
  
  return text;
}

// ------==========----
function ParseInput() {
// ------==========----
  var data = [];
  var ms_min = 1e15;
  var ms_max = -1e15;
  var uA_min = 1e15;
  var uA_max = -1e15;
  var mV_min = 1e15;
  var mV_max = -1e15;
  
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
    
    if (ms < ms_min) ms_min = ms;
    if (ms > ms_max) ms_max = ms;
    if (uA < uA_min) uA_min = uA;
    if (uA > uA_max) uA_max = uA;
    if (mV < mV_min) mV_min = mV;
    if (mV > mV_max) mV_max = mV;
    
    data.push([ ms, uA, mV ]);
  });
  
  return {
    'ms_min': ms_min, 'ms_max': ms_max,
    'uA_min': uA_min, 'uA_max': uA_max,
    'mV_min': mV_min, 'mV_max': mV_max,
    'data': data
  };      
}

// ------==============----
function ShowFullOutput() {
// ------==============----
  var dataset = ParseInput();
  var text    = GetOutput(dataset);
  $('#output-snippet').val(text);
}

// ------===================----
function UpdateOutputSnippet() {
// ------===================----
  var dataset = ParseInput();
  var text    = GetOutput(dataset, OUTPUT_SNIPPET_LIMIT);
  $('#output-snippet').val(text);
}
