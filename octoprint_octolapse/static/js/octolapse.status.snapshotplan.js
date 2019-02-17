/*
##################################################################################
# Octolapse - A plugin for OctoPrint used for making stabilized timelapse videos.
# Copyright (C) 2019  Brad Hochgesang
##################################################################################
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published
# by the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see the following:
# https://github.com/FormerLurker/Octolapse/blob/master/LICENSE
#
# You can contact the author either through the git-hub repository, or at the
# following email address: FormerLurker@pm.me
##################################################################################
*/
Octolapse.snapshotPlanStateViewModel = function() {
            var self = this;
            self.snapshot_plans = ko.observable([]);
            self.current_plan_index = ko.observable();
            self.plan_index = ko.observable();
            self.view_current_plan = ko.observable(true);
            self.current_file_line = ko.observable(0);

            self.plan_count = ko.observable(null);
            self.lines_remaining = ko.observable(null);
            self.lines_total = ko.observable(null);
            self.x_initial = ko.observable(null).extend({numeric: 2});
            self.y_initial = ko.observable(null).extend({numeric: 2});
            self.z_initial = ko.observable(null).extend({numeric: 2});
            self.x_return = ko.observable(null).extend({numeric: 2});
            self.y_return = ko.observable(null).extend({numeric: 2});
            self.z_return = ko.observable(null).extend({numeric: 2});
            self.progress_percent = ko.observable(null).extend({numeric: 2});
            self.snapshot_positions = ko.observableArray([]);
            self.is_animating_plans = ko.observable(false);

            self.update = function (state) {
                if (state.snapshot_plans != null)
                {
                    self.snapshot_plans(state.snapshot_plans);
                    self.plan_count(state.snapshot_plans.length);
                }
                if (state.current_plan_index != null)
                {
                    self.current_plan_index(state.current_plan_index);
                    if (self.view_current_plan())
                    {
                        self.plan_index(state.current_plan_index);
                    }
                }
                if (state.current_file_line != null)
                    self.current_file_line(state.current_file_line);

                if (state.printer_volume != null)
                    self.printer_volume = state.printer_volume;
                self.update_current_plan();
            };

            self.update_current_plan = function()
            {
                if (! (self.snapshot_plans().length > 0 && self.plan_index() <  self.snapshot_plans().length))
                {
                    return;
                }

                var showing_plan = self.snapshot_plans()[self.plan_index()];
                var current_plan = self.snapshot_plans()[self.current_plan_index()];
                var previous_plan = null;
                var previous_line = 0;

                var lines_remaining = current_plan.file_line_number - self.current_file_line();

                self.lines_remaining(lines_remaining);
                var previous_line = 0;
                if (self.current_plan_index() - 1 > 0)
                    previous_plan = self.snapshot_plans()[self.current_plan_index() - 1]
                if (previous_plan != null)
                    previous_line = previous_plan.file_line_number;
                var lines_total = current_plan.file_line_number - previous_line;
                self.lines_total(lines_total);
                self.progress_percent((1-(lines_remaining / lines_total)) * 100);

                self.x_initial(showing_plan.initial_position.x);
                self.y_initial(showing_plan.initial_position.y);
                self.z_initial(showing_plan.initial_position.z);
                self.x_return(showing_plan.return_position.x);
                self.y_return(showing_plan.return_position.y);
                self.z_return(showing_plan.return_position.z);
                self.snapshot_positions(showing_plan.snapshot_positions);
                // Update Canvass
                self.updateCanvas();
            }

            self.next_plan_clicked = function()
            {
                self.is_animating_plans(false);
                self.view_current_plan(false);
                var index = self.plan_index()+1;
                if (index < self.snapshot_plans().length)
                {
                    self.plan_index(index);
                }
                self.update_current_plan()
                return false;
            };

            self.previous_plan_clicked = function()
            {
                self.is_animating_plans(false);
                self.view_current_plan(false);
                var index = self.plan_index()-1;
                if (index > -1 && self.snapshot_plans().length > 0)
                {
                    self.plan_index(index);
                }
                self.update_current_plan()
                return false;
            };

            self.show_current_plan_clicked = function()
            {
                self.is_animating_plans(false);
                self.view_current_plan(true);
                self.plan_index(self.current_plan_index());
                self.update_current_plan()
                return false;
            };

            self.animate_plan_clicked = function()
            {
                if(self.is_animating_plans()) {
                    console.log("Snapshot Plans are already animating.");
                    return;
                }
                console.log("Animating Snapshot Plans.");
                self.is_animating_plans(true);
                self.view_current_plan(false);

                if (self.snapshot_plans().length>0)
                    self.animate_plan(0);
            }

            self.animate_plan = function(index)
            {
                setTimeout(function() {
                    if (!self.is_animating_plans())
                        return;
                    self.plan_index(index);
                    self.update_current_plan();
                    index++;
                    if (index < self.snapshot_plans().length)
                        self.animate_plan(index)
                    else
                    {
                        self.view_current_plan(true);
                        self.plan_index(self.current_plan_index());
                        self.is_animating_plans(false);
                        self.update_current_plan();
                    }
                }, 33.3);
            }
            // Canvass Variables
            self.canvas_printer_size = [125,125,125];
            self.canvas_border_size = [14,14,14];
            self.legend_size = [115,0,0]
            self.canvas_size = [
                self.canvas_printer_size[0]+self.canvas_border_size[0]*2+self.legend_size[0],
                self.canvas_printer_size[1]+self.canvas_border_size[1]*2+self.legend_size[1],
                self.canvas_printer_size[2]+self.canvas_border_size[2]*2+self.legend_size[2]
            ];

            self.printer_volume = null;
            self.x_canvas_scale = null;
            self.y_canvas_scale = null;
            self.z_canvas_scale = null;
            self.canvas_location_radius=3;
            self.canvas = null;
            self.canvas_context = null;

            self.updateCanvas = function () {
                self.canvas_update_scale();
                if (self.canvas === null)
                {
                    self.canvas = document.createElement('canvas');
                    self.canvas.width = self.canvas_size[0];
                    self.canvas.height = self.canvas_size[1];
                    var snapshotConatiner = $("#snapshot_plan_canvas_container");
                    $(self.canvas).attr('id','snapshot_plan_canvas').text('unsupported browser').appendTo("#snapshot_plan_canvas_container");
                    self.canvas_context = self.canvas.getContext('2d');
                    self.canvas_erase_contents();
                    self.canvas_draw_axis();
                    self.canvas_draw_legend();
                }
                if (self.canvas_context == null)
                {
                    console.log("Octolapse - Unable to create canvas context!");
                    return;
                }
                self.canvas_erase_print_bed();
                self.canvas_draw_print_bed();
                self.canvas_draw_start_location();
                self.canvas_draw_snapshot_locations();
                self.canvas_draw_return_location();
            };

            self.canvas_update_scale = function()
            {
                self.x_canvas_scale = self.canvas_printer_size[0]/(self.printer_volume.max_x - self.printer_volume.min_x);
                self.y_canvas_scale = self.canvas_printer_size[1]/(self.printer_volume.max_y - self.printer_volume.min_y);
                self.z_canvas_scale = self.canvas_printer_size[2]/(self.printer_volume.max_z - self.printer_volume.min_z);
            };

            self.canvas_draw_print_bed = function()
            {
                // draw a line around the print area
                // draw the x axis linebottom border plus the intersection
                self.canvas_context.strokeStyle = '#000000';
                // draw the outside
                self.canvas_context.beginPath();
                self.canvas_context.rect(
                    self.canvas_border_size[0],
                    self.canvas_border_size[1],
                    self.canvas_printer_size[0],
                    self.canvas_printer_size[1]
                );
                self.canvas_context.stroke();
                //draw grid lines
                var num_increments = 4;
                for (var increment = 0; increment<num_increments ; increment++)
                {
                    var x = self.canvas_printer_size[0]/num_increments*increment;
                    var y = self.canvas_printer_size[1]/num_increments*increment;
                    // draw the vertical separator.
                    self.canvas_context.beginPath();
                    self.canvas_context.moveTo(self.canvas_border_size[0]+x, self.canvas_border_size[1]);
                    self.canvas_context.lineTo(self.canvas_border_size[0]+x, self.canvas_border_size[1] + self.canvas_printer_size[1]);
                    self.canvas_context.stroke();
                    // draw the horizontal separator
                    self.canvas_context.beginPath();
                    self.canvas_context.moveTo(self.canvas_border_size[0], self.canvas_border_size[1]+y);
                    self.canvas_context.lineTo(self.canvas_border_size[0]+self.canvas_printer_size[0], self.canvas_border_size[1]+y);
                    self.canvas_context.stroke();
                }
            };

            self.axis_line_length = 25;
            self.canvas_draw_axis = function() {
                self.canvas_context.strokeStyle = '#000000';
                // **draw the x arrow
                // draw the vertical line
                self.canvas_context.beginPath();
                self.canvas_context.moveTo(
                    self.canvas_border_size[0] * 0.5,
                    self.canvas_printer_size[1] + self.canvas_border_size[1] * 1.5
                );
                self.canvas_context.lineTo(
                    self.canvas_border_size[0] * 0.5,
                    self.canvas_printer_size[1] + self.canvas_border_size[1] * 1.5 - self.axis_line_length
                );
                self.canvas_context.stroke();
                // draw the left side of the arrow
                self.canvas_context.beginPath();
                self.canvas_context.moveTo(
                    self.canvas_border_size[0] * 0.5,
                    self.canvas_printer_size[1] + self.canvas_border_size[1] * 1.5 - self.axis_line_length
                );
                self.canvas_context.lineTo(
                    self.canvas_border_size[0] * 0.25,
                    self.canvas_printer_size[1] + self.canvas_border_size[1] * 1.75 - self.axis_line_length
                );
                self.canvas_context.stroke();
                // draw the right side of the arrow
                self.canvas_context.beginPath();
                self.canvas_context.moveTo(
                    self.canvas_border_size[0] * 0.5,
                    self.canvas_printer_size[1] + self.canvas_border_size[1] * 1.5 - self.axis_line_length
                );
                self.canvas_context.lineTo(
                    self.canvas_border_size[0] * 0.75,
                    self.canvas_printer_size[1] + self.canvas_border_size[1] * 1.75 - self.axis_line_length
                );
                self.canvas_context.stroke();
                // draw the Y label
                self.canvas_context.fillStyle = "#000000";
                self.canvas_context.textAlign="left";
                var text_width = self.canvas_context.measureText("Y");
                self.canvas_context.font = "12px Helvetica Neue,Helvetica,Arial,sans-serif";
                self.canvas_context.fillText(
                    "Y",
                    self.canvas_border_size[0] * 0.5 - text_width.width/2 - 1,
                    self.canvas_printer_size[1] - self.axis_line_length + self.canvas_border_size[1] * 1.5 - 2
                )

                // *** draw the X arrow
                // draw the horizontal line
                self.canvas_context.beginPath();
                self.canvas_context.moveTo(
                    self.canvas_border_size[0] * 0.5,
                    self.canvas_printer_size[1] + self.canvas_border_size[1] * 1.5
                );
                self.canvas_context.lineTo(
                    self.canvas_border_size[0] * 0.5 + self.axis_line_length,
                    self.canvas_printer_size[1] + self.canvas_border_size[1] * 1.5
                );
                self.canvas_context.stroke();
                // draw the top side of the arrow
                self.canvas_context.beginPath();
                self.canvas_context.moveTo(
                    self.canvas_border_size[0] * 0.5 + self.axis_line_length,
                    self.canvas_printer_size[1] + self.canvas_border_size[1] * 1.5
                );
                self.canvas_context.lineTo(
                    self.canvas_border_size[0] * 0.25 + self.axis_line_length,
                    self.canvas_printer_size[1] + self.canvas_border_size[1] * 1.25
                );
                self.canvas_context.stroke();
                // draw the right side of the arrow
                self.canvas_context.beginPath();
                self.canvas_context.moveTo(
                    self.canvas_border_size[0] * 0.5 + self.axis_line_length,
                    self.canvas_printer_size[1] + self.canvas_border_size[1] * 1.5
                );
                self.canvas_context.lineTo(
                    self.canvas_border_size[0] * 0.25 + self.axis_line_length,
                    self.canvas_printer_size[1] + self.canvas_border_size[1] * 1.75
                );
                self.canvas_context.stroke();
                // draw the X label
                self.canvas_context.fillStyle = "#000000";
                self.canvas_context.textAlign="left";
                self.canvas_context.font = "12px Helvetica Neue,Helvetica,Arial,sans-serif";
                self.canvas_context.fillText(
                    "X",
                    self.canvas_border_size[0] * 0.5 + self.axis_line_length,
                    self.canvas_printer_size[1] + self.canvas_border_size[1] * 1.5 + 4.5
                )

            };

            self.canvas_draw_legend = function() {

                var lineHeight = 18;
                x = self.canvas_border_size[0]*2+self.canvas_printer_size[0];
                y = self.canvas_border_size[1]*2;

                // *** Initial Position
                // Draw the start circul
                self.canvas_context.strokeStyle = '#ff0000';
                self.canvas_context.beginPath();
                self.canvas_context.arc(x,y, self.canvas_location_radius, 0, 2 * Math.PI);
                self.canvas_context.stroke();// draw start circle
                // Draw the start  position text
                self.canvas_context.fillStyle = "#000000";
                self.canvas_context.textAlign="left";
                var text = "Initial Position";
                self.canvas_context.font = "12px Helvetica Neue,Helvetica,Arial,sans-serif";
                self.canvas_context.fillText(
                    text,
                    x + self.canvas_location_radius*2,
                    y + self.canvas_location_radius*2
                );
                // Snapshot Position
                // draw the circle
                y+= lineHeight;
                self.canvas_context.strokeStyle = '#0000ff';
                self.canvas_context.beginPath();
                self.canvas_context.arc(x,y, self.canvas_location_radius, 0, 2 * Math.PI);
                self.canvas_context.stroke();// draw start circle
                // Draw the start  position text
                self.canvas_context.fillStyle = "#000000";
                self.canvas_context.textAlign="left";
                text = "Snapshot Position";
                self.canvas_context.font = "12px Helvetica Neue,Helvetica,Arial,sans-serif";
                self.canvas_context.fillText(
                    text,
                    x + self.canvas_location_radius*2,
                    y + self.canvas_location_radius*2
                );
                // Return Position
                // draw the circle
                y += lineHeight;
                self.canvas_context.strokeStyle = '#00ff00';
                self.canvas_context.beginPath();
                self.canvas_context.arc(x,y, self.canvas_location_radius, 0, 2 * Math.PI);
                self.canvas_context.stroke();// draw start circle
                // Draw the start  position text
                self.canvas_context.fillStyle = "#000000";
                self.canvas_context.textAlign="left";
                text = "Return Position";
                self.canvas_context.font = "12px Helvetica Neue,Helvetica,Arial,sans-serif";
                self.canvas_context.fillText(
                    text,
                    x + self.canvas_location_radius*2,
                    y + self.canvas_location_radius*2
                );
            };

            self.canvas_erase_contents = function(){
                self.canvas_context.fillStyle = '#ffffff';
                self.canvas_context.fillRect(0,0,self.canvas_size[0],self.canvas_size[1]);
            };

            self.canvas_erase_print_bed = function(){
                console.log("Erasing Bed");
                self.canvas_context.fillStyle = '#ffffff';
                self.canvas_context.fillRect(
                    self.canvas_border_size[0] - self.canvas_location_radius,
                    self.canvas_border_size[1] - self.canvas_location_radius,
                    self.canvas_printer_size[0] + self.canvas_location_radius*2,
                    self.canvas_printer_size[1] + self.canvas_location_radius*2
                );
            };

            self.canvas_draw_start_location = function()             {
                self.canvas_context.strokeStyle = '#ff0000';
                self.canvas_context.beginPath();
                self.canvas_context.arc(self.to_canvas_x(self.x_initial()), self.to_canvas_y(self.y_initial()), self.canvas_location_radius, 0, 2 * Math.PI);
                self.canvas_context.stroke();
            };

            self.canvas_draw_snapshot_locations = function() {
                self.canvas_context.strokeStyle = '#0000ff';
                for (var index = 0; index < self.snapshot_positions().length; index++)
                {
                    var position = self.snapshot_positions()[index];
                    self.canvas_context.beginPath();
                    self.canvas_context.arc(self.to_canvas_x(position.x), self.to_canvas_y(position.y), self.canvas_location_radius, 0, 2 * Math.PI);
                    self.canvas_context.stroke();
                }
            };

            self.canvas_draw_return_location = function()
            {
                self.canvas_context.strokeStyle = '#00ff00';
                self.canvas_context.beginPath();
                self.canvas_context.arc(self.to_canvas_x(self.x_return()), self.to_canvas_y(self.y_return()), self.canvas_location_radius, 0, 2 * Math.PI);
                self.canvas_context.stroke();
            };

            self.to_canvas_x = function(x)
            {
                return (x + self.printer_volume.min_x)*self.x_canvas_scale + self.canvas_border_size[0];
            }

            self.to_canvas_y = function(y)
            {
                return (self.printer_volume.max_y - y)*self.y_canvas_scale + self.canvas_border_size[1];
            }

            self.to_canvas_z = function(z)
            {
                return (z + self.printer_volume.min_z)*self.z_canvas_scale + self.canvas_border_size[2];
            }

        }